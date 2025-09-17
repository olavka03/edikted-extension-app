import { ExtensionSettings } from '@shopify/ui-extensions/checkout';

export interface SplittedJwtPayload {
  aud: string;
  dest: string;
  exp: number;
  iat: number;
  jti: string;
  nbf: number;
}

export interface Media {
  id: string;
  image: {
    id: string;
    url: string;
    width: number;
    height: number;
  };
}

export interface ProductVariant {
  id: string;
  title: string;
  price: {
    amount: string;
    currencyCode: string;
  };
}

export type ProductData = {
  id: string;
  title: string;
  media: {
    nodes: Media[];
  };
  variants: {
    nodes: ProductVariant[];
  };
};

export enum ShippingProtectionDefaultValues {
  Title = 'Shipping Protection',
  Tag = 'shipping-protection',
  Type = 'Insurance',
  Vendor = 'NVD-Protection',
  OptionName = 'ID',
}

export interface CustomExtensionSettings extends ExtensionSettings {
  shipping_protection_product_id: string;
  widget_title: string;
  widget_description: string;
  widget_warning: string;
  shipping_protection_percentage: string;
  shipping_protection_disclaimer: string;
}

export enum ExtensionDefaultSettings {
  WidgetTitle = 'Shipping Protection',
  WidgetDescription = 'Our Delivery Guarantee, convering losses or theft during transit for {{amount}}',
  ShippingProtectionPercentage = 1.5,
  ShippingProtectionDisclaimer = 'Disclaimer: This is an optional additional service for expedited replacements and is not a shipping fee',
  ShippingProtectionWarning = 'By Deselecting Shipping Protection, we will not be liable for lost or stolen packages.',
}
