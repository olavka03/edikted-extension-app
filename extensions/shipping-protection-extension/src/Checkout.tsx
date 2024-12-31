import {
  reactExtension,
  BlockStack,
  Heading,
  Text,
  View,
  InlineLayout,
  useCartLines,
  useApplyCartLinesChange,
  useCurrency,
  Switch,
  useSettings,
  Banner,
  Image,
  useApi,
  useBuyerJourney,
} from '@shopify/ui-extensions-react/checkout';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ShippingProtectionDefaultValues,
  CustomExtensionSettings,
  ExtensionDefaultSettings,
  ShopifyGIDType,
  ProductData,
} from './types';
import { CartLineChange } from '@shopify/ui-extensions/checkout';
import { formatPrice } from './utils/priceFormatter';
import { parseShopifyGID } from './utils/parseShopifyGID';
import { findClosestVariant } from './utils/findClosestVariant';
import { Attribute } from '@shopify/ui-extensions/src/surfaces/checkout';
import {
  useLocalizationCountry,
  useLocalizationMarket,
} from '@shopify/ui-extensions-react/checkout';

function ShippingProtectionExtension() {
  const cartLines = useCartLines();
  const { isoCode } = useCurrency();
  const { extension, query } = useApi();
  const settings = useSettings<CustomExtensionSettings>();
  const applyCartLinesChange = useApplyCartLinesChange();
  const { isoCode: countryCode } = useLocalizationCountry();

  const [shippingProtection, setShippingProtection] =
    useState<ProductData | null>(null);
  const [isSelectedShippingProtetion, setIsSelectedShippingProtetion] =
    useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const firstRender = useRef(true);

  const isCustomizeCheckoutPage = useMemo(
    () => extension.editor?.type === 'checkout',
    [extension],
  );

  const shippingProtectionPrice = useMemo(() => {
    if (!shippingProtection) {
      return null;
    }

    const cartLinesTotalPrice = cartLines.reduce((acc, lineItem) => {
      const isShippingProtectionLineItem =
        lineItem.merchandise.product.productType ===
        ShippingProtectionDefaultValues.Tag;

      const currentLineItemPrice = !isShippingProtectionLineItem
        ? lineItem.cost.totalAmount.amount
        : 0;

      acc += currentLineItemPrice;

      return acc;
    }, 0);

    const percantage =
      (+settings.shipping_protection_percantage ||
        ExtensionDefaultSettings.ShippingProtectionPercantage) / 100;

    const shippingProtectionPrice = Number(
      (cartLinesTotalPrice * percantage).toFixed(2),
    );

    return shippingProtectionPrice;
  }, [cartLines, shippingProtection]);

  const closestShippingProtectionVariant = useMemo(() => {
    if (!shippingProtection || !shippingProtectionPrice) {
      return null;
    }

    const { nodes: shippingProtectionVariants } = shippingProtection.variants;

    const closestVariant = findClosestVariant(
      shippingProtectionVariants,
      shippingProtectionPrice,
    );

    return closestVariant;
  }, [shippingProtectionPrice, shippingProtection]);

  const isShippingProtectionExist = useCallback(() => {
    return cartLines.some(
      ({ merchandise }) =>
        merchandise.product.productType ===
          ShippingProtectionDefaultValues.Tag ||
        merchandise.title === ShippingProtectionDefaultValues.Title,
    );
  }, [cartLines]);

  const generateWidgetDescription = useCallback(() => {
    const widgetDescription = settings.widget_description;

    if (!closestShippingProtectionVariant && !isCustomizeCheckoutPage) {
      return;
    }

    if (
      (!widgetDescription || !closestShippingProtectionVariant) &&
      !isCustomizeCheckoutPage
    ) {
      return;
    }

    const [beforeAmount, afterAmount] = widgetDescription.split('{{amount}}');

    const amount = formatPrice(
      isoCode,
      !isCustomizeCheckoutPage
        ? Number(closestShippingProtectionVariant.price.amount)
        : ExtensionDefaultSettings.ShippingProtectionPercantage,
    );

    const appearance = loading ? 'subdued' : 'info';
    const hasWarning = firstRender.current
      ? !isShippingProtectionExist()
      : !isSelectedShippingProtetion;

    return (
      <BlockStack padding="extraTight" spacing="none">
        <View>
          {beforeAmount && (
            <>
              <Text appearance={appearance} size="small">
                {beforeAmount.trim()}
              </Text>{' '}
            </>
          )}
          <Text appearance={appearance} size="small" emphasis="bold">
            {amount}
          </Text>
          {afterAmount && (
            <>
              {' '}
              <Text appearance={appearance} size="small">
                {afterAmount.trim()}
              </Text>
            </>
          )}
        </View>
        {hasWarning && settings.widget_warning && (
          <View>
            <Text appearance={appearance} size="small">
              {settings.widget_warning}
            </Text>
          </View>
        )}
      </BlockStack>
    );
  }, [
    countryCode,
    isoCode,
    settings,
    loading,
    isSelectedShippingProtetion,
    closestShippingProtectionVariant,
  ]);

  const removeShippingProtectionFromCart = useCallback(async () => {
    const shippingProtectionLineItems = cartLines.filter(
      ({ merchandise }) =>
        merchandise.product.productType ===
          ShippingProtectionDefaultValues.Tag ||
        merchandise.title === ShippingProtectionDefaultValues.Title,
    );

    const cartChanges = shippingProtectionLineItems.map(({ id, quantity }) => ({
      type: 'removeCartLine',
      id,
      quantity,
    }));

    await Promise.all(
      cartChanges.map((cartChange) =>
        applyCartLinesChange(cartChange as CartLineChange),
      ),
    );
  }, [cartLines]);

  const addShippingProtectionToCart = useCallback(
    async (variantId: string) => {
      const disclaimerParts =
        settings.shipping_protection_disclaimer?.split(':');

      const disclaimerAttribute: Attribute = {
        key: disclaimerParts.length <= 1 ? 'Disclaimer' : disclaimerParts[0],
        value:
          disclaimerParts.length <= 1
            ? disclaimerParts[0].trim()
            : disclaimerParts[1].trim(),
      };

      await applyCartLinesChange({
        type: 'addCartLine',
        quantity: 1,
        merchandiseId: variantId,
        attributes: [disclaimerAttribute],
      });
    },
    [settings],
  );

  const toggleShippingProtection = useCallback(
    async (isSelected: boolean = false) => {
      try {
        if (firstRender.current) {
          firstRender.current = false;
        }

        setLoading(true);
        setErrorMessage(null);

        if (!isSelected) {
          await removeShippingProtectionFromCart();
          return;
        }

        if (closestShippingProtectionVariant) {
          await addShippingProtectionToCart(
            closestShippingProtectionVariant.id,
          );
        }
      } catch (err) {
        setErrorMessage(
          err?.message ||
            'An error occurred when trying to add or remove Shipping Protection. Try again or reload the page',
        );
      } finally {
        setLoading(false);
      }
    },
    [closestShippingProtectionVariant, cartLines],
  );

  useEffect(() => {
    const getShippingProtectionProdutData = async () => {
      const productId = parseShopifyGID(
        settings.shipping_protection_product_id,
        ShopifyGIDType.Product,
      );

      try {
        setErrorMessage(null);

        const {
          data: { product },
          errors,
        } = await query<{ product: ProductData }>(
          `
          query GetProduct($id: ID!, $country: CountryCode) @inContext(country: $country) {
            product(id: $id) {
              id
              title
              media(first: 1, sortKey: POSITION) {
                nodes {
                  id
                  ... on MediaImage {
                  image {
                    id
                    width
                    height
                    url
                  }
                }
                }
              }
              variants(first: 100) {
                nodes {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        `,
          { variables: { id: productId, country: countryCode } },
        );

        console.log({ product });

        if (errors?.length > 0) {
          const [firstError] = errors;
          const errorMessage =
            firstError.message ||
            'An error occurred when trying to fetch Shipping Protection. Try again or reload the page';

          setErrorMessage(errorMessage);

          return;
        }

        setShippingProtection(product);
      } catch (err) {
        setErrorMessage(
          err?.message ||
            'An error occurred when trying to fetch Shipping Protection. Try again or reload the page',
        );
      }
    };

    getShippingProtectionProdutData();
  }, [settings, countryCode]);

  return (
    <BlockStack>
      <BlockStack borderRadius="base">
        {settings.widget_title && (
          <Heading level={2}>{settings.widget_title}</Heading>
        )}
        <InlineLayout
          columns={['15%', 'fill', 'auto']}
          blockAlignment="center"
          border="base"
          borderRadius="base"
          padding="tight"
        >
          <View
            minInlineSize={60}
            maxInlineSize={60}
            minBlockSize={60}
            maxBlockSize={60}
          >
            <Image
              borderRadius="base"
              loading="lazy"
              source="https://cdn.shopify.com/s/files/1/0600/9035/1851/products/demo-upload.png?v=1686746074"
              // source={shippingProtection?.media?.nodes?.[0]?.image?.url}
              fit="contain"
            />
          </View>
          {generateWidgetDescription()}
          <View inlineAlignment="end" padding="extraTight">
            <Switch
              checked={isShippingProtectionExist()}
              onChange={(isSelected: boolean) => {
                setIsSelectedShippingProtetion(isSelected);
                toggleShippingProtection(isSelected);
              }}
              accessibilityLabel="shipping-protetion-toggler"
            />
          </View>
        </InlineLayout>
      </BlockStack>
      {errorMessage && <Banner status="critical" title={errorMessage} />}
    </BlockStack>
  );
}

export default reactExtension(
  'purchase.checkout.shipping-option-list.render-after',
  () => <ShippingProtectionExtension />,
);
