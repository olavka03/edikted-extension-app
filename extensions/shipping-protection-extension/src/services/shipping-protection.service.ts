import { client } from '../../httpClient';
import { CreateShippingProtectionsBody, ShippingProtection } from '../types';

export const create = async (
  createShippingProtectionsBody: CreateShippingProtectionsBody,
) => {
  return client.post<ShippingProtection | null>(
    '/shipping-protection/create',
    createShippingProtectionsBody,
  );
};
