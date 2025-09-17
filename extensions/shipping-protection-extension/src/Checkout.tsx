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
  useShippingAddress,
} from '@shopify/ui-extensions-react/checkout';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  CustomExtensionSettings,
  ExtensionDefaultSettings,
  ProductData,
} from './types';
import { CartLineChange } from '@shopify/ui-extensions/checkout';
import { formatPrice } from './utils/priceFormatter';
import { parseShopifyGID } from '../../../utils';
import { ShopifyGIDType } from '../../../types';
import { findClosestVariant } from './utils/findClosestVariant';
import { Attribute } from '@shopify/ui-extensions/src/surfaces/checkout';
import { useLocalizationCountry } from '@shopify/ui-extensions-react/checkout';

function ShippingProtectionExtension() {
  const cartLines = useCartLines();
  const { isoCode } = useCurrency();
  const { extension, query } = useApi();
  const settings = useSettings<CustomExtensionSettings>();
  const applyCartLinesChange = useApplyCartLinesChange();
  const shippingAddress = useShippingAddress();
  const { isoCode: countryCode } = useLocalizationCountry();
  const [shippingProtection, setShippingProtection] = useState<ProductData | null>(null);
  const [isSelectedShippingProtection, setIsSelectedShippingProtection] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const firstRender = useRef(true);
  const hasInitialized = useRef(false);

  // const settings: CustomExtensionSettings = {
  //   widget_title: 'Shipping Protection',
  //   widget_description:
  //     'Our Delivery Guarantee, covering losses or theft during transit for {{amount}}',
  //   widget_warning:
  //     'By Deselecting Shipping Protection, we will not be liable for lost or stolen packages.',
  //   shipping_protection_disclaimer:
  //     'Disclaimer: This is an optional additional service for expedited replacements and is not a shipping fee.',
  //   shipping_protection_percentage: '1.5',
  //   shipping_protection_product_id: '8927072977135',
  // };


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
        lineItem.merchandise.product.id ===
        parseShopifyGID(
          settings.shipping_protection_product_id,
          ShopifyGIDType.Product,
        );

      const currentLineItemPrice = !isShippingProtectionLineItem
        ? lineItem.cost.totalAmount.amount
        : 0;

      acc += currentLineItemPrice;

      return acc;
    }, 0);

    const percentage =
      (+settings.shipping_protection_percentage ||
        ExtensionDefaultSettings.ShippingProtectionPercentage) / 100;

    const shippingProtectionPrice = Number(
      (cartLinesTotalPrice * percentage).toFixed(2),
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

    console.debug({
      closestVariant,
      shippingProtectionVariants,
      shippingProtectionPrice,
    });

    return closestVariant;
  }, [shippingProtectionPrice, shippingProtection]);

  const isShippingProtectionExist = useCallback(() => {
    return cartLines.some(
      ({ merchandise }) =>
        merchandise.product.id ===
        parseShopifyGID(
          settings.shipping_protection_product_id,
          ShopifyGIDType.Product,
        ),
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
        : ExtensionDefaultSettings.ShippingProtectionPercentage,
    );

    const appearance = loading ? 'subdued' : 'info';
    const hasWarning = !isSelectedShippingProtection;

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
    isSelectedShippingProtection,
    closestShippingProtectionVariant,
  ]);

  const removeShippingProtectionFromCart = useCallback(async () => {
    const shippingProtectionLineItems = cartLines.filter(
      ({ merchandise }) =>
        merchandise.product.id ===
        parseShopifyGID(
          settings.shipping_protection_product_id,
          ShopifyGIDType.Product,
        ),
    );

    const cartChanges = shippingProtectionLineItems.map(({ id, quantity }) => ({
      type: 'removeCartLine',
      id,
      quantity,
    }));

    setIsSelectedShippingProtection(false)

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

      setIsSelectedShippingProtection(true)

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
    const getShippingProtectionProductData = async () => {
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

    getShippingProtectionProductData();
  }, [settings, countryCode]);

  useEffect(() => {
    if (
      !closestShippingProtectionVariant ||
      !firstRender.current ||
      hasInitialized.current
    ) {
      return;
    }

    hasInitialized.current = true;

    const initShippingProtection = async () => {
      if (isShippingProtectionExist()) {
        await removeShippingProtectionFromCart();
      }

      await toggleShippingProtection(true);
    };

    initShippingProtection();
  }, [closestShippingProtectionVariant]);

  useEffect(() => {
    if (!isShippingProtectionExist()) {
      setIsSelectedShippingProtection(false)
    }
  }, [cartLines])

  return (
    <BlockStack>
      <BlockStack borderRadius="base">
        {settings.widget_title && (
          <Heading level={2}>{settings.widget_title}</Heading>
        )}
        <InlineLayout
          columns={{
            conditionals: [
              {
                conditions: { viewportInlineSize: { min: 'extraSmall' } },
                value: ['25%', 'fill', 'auto'],
              },
              {
                conditions: { viewportInlineSize: { min: 'small' } },
                value: ['15%', 'fill', 'auto'],
              },
            ],
          }}
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
            {/* <Image
              borderRadius="base"
              loading="lazy"
              source={
                'https://cdn.shopify.com/s/files/1/0467/4148/7783/products/demo-upload.png?v=1687072917'
              }
              fit="contain"
            /> */}
            <Image
              borderRadius="base"
              loading="lazy"
              source={shippingProtection?.media?.nodes?.[0]?.image?.url}
              fit="contain"
            />
          </View>
          {generateWidgetDescription()}
          <View inlineAlignment="end" padding="extraTight">
            <Switch
              checked={isSelectedShippingProtection}
              onChange={async (isSelected: boolean) => {
                await toggleShippingProtection(isSelected);
              }}
              accessibilityLabel="shipping-protection-toggler"
            />
          </View>
        </InlineLayout>
      </BlockStack>
      {errorMessage && <Banner status="critical" title={errorMessage} />}
    </BlockStack>
  );
}

export default reactExtension(
  'purchase.checkout.delivery-address.render-after',
  () => <ShippingProtectionExtension />,
);
