import { request } from 'framework/utils/request.js';
import { Config } from 'framework/config.js';

/**
 * Performs a GET request to the given endpoint.
 *
 * @param {string} endpoint - The API endpoint or full URL.
 * @param {object} options - Optional fetch options (e.g., headers, query params).
 * @returns {Promise<any>} - Resolves with the parsed response.
 */
export function getData(endpoint, options = {}) {
  // Construct full URL if a relative endpoint is provided
  const url = endpoint.startsWith('http')
    ? endpoint
    : Config.api.baseUrl + endpoint;

  // Merge default headers with any custom headers
  return request(url, 'GET', null, {
    headers: { ...Config.api.defaultHeaders, ...options.headers },
    ...options
  });
}

/**
 * Performs a POST request to the given endpoint with a JSON payload.
 *
 * @param {string} endpoint - The API endpoint (relative to baseUrl).
 * @param {any} data - The payload to send in the request body.
 * @param {object} options - Optional fetch options (e.g., headers).
 * @returns {Promise<any>} - Resolves with the parsed response.
 */
export function postData(endpoint, data, options = {}) {
  return request(
    Config.api.baseUrl + endpoint,
    'POST',
    data,
    {
      headers: { ...Config.api.defaultHeaders, ...options.headers },
      ...options
    }
  );
}

/**
 * Performs a PUT request to the given endpoint with a JSON payload.
 *
 * @param {string} endpoint - The API endpoint (relative to baseUrl).
 * @param {any} data - The payload to send in the request body.
 * @param {object} options - Optional fetch options.
 * @returns {Promise<any>} - Resolves with the parsed response.
 */
export function putData(endpoint, data, options = {}) {
  return request(
    Config.api.baseUrl + endpoint,
    'PUT',
    data,
    {
      headers: { ...Config.api.defaultHeaders, ...options.headers },
      ...options
    }
  );
}

/**
 * Performs a PATCH request to the given endpoint with a JSON payload.
 *
 * @param {string} endpoint - The API endpoint (relative to baseUrl).
 * @param {any} data - The payload to send in the request body.
 * @param {object} options - Optional fetch options.
 * @returns {Promise<any>} - Resolves with the parsed response.
 */
export function patchData(endpoint, data, options = {}) {
  return request(
    Config.api.baseUrl + endpoint,
    'PATCH',
    data,
    {
      headers: { ...Config.api.defaultHeaders, ...options.headers },
      ...options
    }
  );
}

/**
 * Performs a DELETE request to the given endpoint, optionally with a payload.
 *
 * @param {string} endpoint - The API endpoint (relative to baseUrl).
 * @param {any|null} data - Optional payload for the DELETE request.
 * @param {object} options - Optional fetch options.
 * @returns {Promise<any>} - Resolves with the parsed response.
 */
export function deleteData(endpoint, data = null, options = {}) {
  return request(
    Config.api.baseUrl + endpoint,
    'DELETE',
    data,
    {
      headers: { ...Config.api.defaultHeaders, ...options.headers },
      ...options
    }
  );
}
