import { ExtensionSettings } from '@shopify/ui-extensions/checkout';

export interface CustomExtensionSettings extends ExtensionSettings {
  shipping_protection_product_id: string;
  remove_product_button_text: string;
}

export enum ExtensionDefaultSettings {
  RemoveProductButtonText = 'remove',
}
