import fetch from 'node-fetch';

const logger = console;

const baseUrl = 'https://local-inventory.nabis.dev/v1/';

export type Endpoint = 'inventory' | 'inventory_aggregate';

export const InventoryEndpoint = 'inventory';
export const InventoryAggregateEndpoint = 'inventory_aggregate';

export const makeApiRequest = async (endpoint: Endpoint, method: 'PUT' | 'POST', record: Record<string, any>): Promise<void> => {
  return Promise.resolve();
  // Here is how we might do this if we actually had an API to use
  // const url = buildUrl(endpoint);
  //
  // try {
  //   const response = await fetch(url, options(method, record));
  //   if (response.status < 200 || response.status >= 300) {
  //     throw new Error(`REQUEST FAILED: [${url}] status ${response.status}:${response.statusText}`);
  //   }
  // } catch (error) {
  //   throw error;
  // }
}

const options = (method: 'PUT' | 'POST', payload: Record<string, any>): any => ({
  method,
  body: JSON.stringify(payload),
  headers: {
    'Content-Type': 'application/json',
  }
})

const buildUrl = (endpoint: Endpoint): string => `${baseUrl}${endpoint}`;