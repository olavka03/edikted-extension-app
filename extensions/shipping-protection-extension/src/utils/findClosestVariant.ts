import { ProductVariant } from '../types';

export const findClosestVariant = (
  variants: ProductVariant[],
  target: number,
): ProductVariant | null => {
  if (variants.length === 0) {
    return null;
  }

  const sortedVariants = variants
    .map((variant) => ({
      ...variant,
      numericPrice: parseFloat(variant.title),
      // numericPrice: parseFloat(variant.price.amount),
    }))
    .sort((a, b) => a.numericPrice - b.numericPrice);

  let left = 0;
  let right = sortedVariants.length - 1;

  const firstPrice = sortedVariants[left].numericPrice;
  const lastPrice = sortedVariants[right].numericPrice;

  if (target <= firstPrice) {
    return sortedVariants[left];
  }

  if (target >= lastPrice) {
    return sortedVariants[right];
  }

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midPrice = sortedVariants[mid].numericPrice;

    if (midPrice === target) {
      return sortedVariants[mid];
    }

    if (target < midPrice) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  if (left >= sortedVariants.length) {
    return sortedVariants[right];
  }
  if (right < 0) {
    return sortedVariants[left];
  }

  const leftVariant = sortedVariants[left];
  const rightVariant = sortedVariants[right];
  const leftDiff = Math.abs(leftVariant.numericPrice - target);
  const rightDiff = Math.abs(rightVariant.numericPrice - target);

  if (leftDiff < rightDiff) {
    return leftVariant;
  } else if (leftDiff > rightDiff) {
    return rightVariant;
  } else {
    return leftVariant;
  }
};
