import { ExtensionSettings } from '@shopify/ui-extensions/checkout';

export interface SplittedJwtPayload {
  aud: string;
  dest: string;
  exp: number;
  iat: number;
  jti: string;
  nbf: number;
}

// export type ID = string;

// export type Money = string;

// export enum ProductVariantInventoryPolicy {
//   Deny = 'DENY',
//   Continue = 'CONTINUE',
// }

// export enum MediaContentType {
//   EXTERNAL_VIDEO = 'EXTERNAL_VIDEO',
//   IMAGE = 'IMAGE',
//   MODEL_3D = 'MODEL_3D',
//   VIDEO = 'VIDEO',
// }

// export interface InventoryItemInput {
//   cost?: Money;
//   tracked?: boolean;
// }

// export interface InventoryLevelInput {
//   locationId: ID;
//   available: number;
// }

// export type MetafieldType =
//   | 'single_line_text_field'
//   | 'multi_line_text_field'
//   | 'number_integer'
//   | 'number_decimal'
//   | 'boolean'
//   | 'date'
//   | 'json';

// export interface CreateMediaInput {
//   originalSource: string;
//   mediaContentType: MediaContentType;
//   alt?: string;
// }

// export interface MetafieldInput {
//   namespace: string;
//   key: string;
//   value: string;
//   type: MetafieldType;
//   description?: string;
// }

// export interface VariantOptionValueInput {
//   optionName: string;
//   name: string;
// }

// export interface ProductVariantsBulkInput {
//   barcode?: string;
//   compareAtPrice?: Money;
//   id?: ID;
//   inventoryItem?: InventoryItemInput;
//   inventoryPolicy?: ProductVariantInventoryPolicy;
//   inventoryQuantities?: InventoryLevelInput[];
//   mediaId?: ID;
//   mediaSrc?: string[];
//   metafields?: MetafieldInput[];
//   optionValues?: VariantOptionValueInput[];
//   price?: Money;
//   taxable?: boolean;
//   taxCode?: string;
// }

// export interface ProductVariantsBulkInput {
//   barcode?: string;
//   compareAtPrice?: Money;
//   id?: ID;
//   inventoryItem?: InventoryItemInput;
//   inventoryPolicy?: ProductVariantInventoryPolicy;
//   inventoryQuantities?: InventoryLevelInput[];
//   mediaId?: ID;
//   mediaSrc?: string[];
//   metafields?: MetafieldInput[];
//   optionValues?: VariantOptionValueInput[];
//   price?: Money;
//   taxable?: boolean;
//   taxCode?: string;
// }

// export interface CreateShippingProtectionsBody {
//   productVariants: ProductVariantsBulkInput[];
//   productMedia?: CreateMediaInput[];
// }

// export interface ShippingProtection {
//   id: ID;
//   title: string;
//   price: Money;
// }

// export interface ApiError {
//   errors: Record<string, string>;
//   message: string;
//   success: boolean;
// }

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

export enum ShopifyGIDType {
  Product = 'Product',
  ProductVariant = 'ProductVariant',
}

export enum ExtensionDefaultSettings {
  WidgetTitle = 'Shipping Protection',
  WidgetDescription = 'Our Delivery Guarantee, convering losses or theft during transit for {{amount}}',
  ShippingProtectionPercentage = 1.5,
  ShippingProtectionDisclaimer = 'Disclaimer: This is an optional additional service for expedited replacements and is not a shipping fee',
  ShippingProtectionWarning = 'By Deselecting Shipping Protection, we will not be liable for lost or stolen packages.',
}
