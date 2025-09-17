import {
  reactExtension,
  InlineStack,
  Link,
  useCartLines,
  useCartLineTarget,
  useSettings,
  useApplyCartLinesChange,
} from '@shopify/ui-extensions-react/checkout';
import { useCallback } from 'react';
import { ShopifyGIDType } from '../../../types';
import { parseShopifyGID } from '../../../utils';
import { CartLineChange } from '@shopify/ui-extensions/checkout';
import { CustomExtensionSettings, ExtensionDefaultSettings } from './types';

function RemoveProductExtension() {
  const cartLines = useCartLines();
  const cartLineTarget = useCartLineTarget();
  const settings = useSettings<CustomExtensionSettings>();
  const applyCartLinesChange = useApplyCartLinesChange();

  // const settings = {
  //   remove_product_button_text: 'remove',
  //   shipping_protection_product_id: '8927072977135',
  // };

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

    await Promise.all(
      cartChanges.map((cartChange) =>
        applyCartLinesChange(cartChange as CartLineChange),
      ),
    );
  }, [cartLines]);

  if (
    cartLineTarget.merchandise.product.id !==
    parseShopifyGID(
      settings.shipping_protection_product_id,
      ShopifyGIDType.Product,
    )
  ) {
    return null;
  }

  return (
    <InlineStack>
      <Link appearance="monochrome" onPress={removeShippingProtectionFromCart}>
        {settings.remove_product_button_text ||
          ExtensionDefaultSettings.RemoveProductButtonText}
      </Link>
    </InlineStack>
  );
}

export default reactExtension(
  'purchase.checkout.cart-line-item.render-after',
  () => <RemoveProductExtension />,
);
