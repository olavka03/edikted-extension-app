export const formatPrice = (currencyCode: string, priceAmount: number) => {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(priceAmount);

  return formattedPrice;
};
