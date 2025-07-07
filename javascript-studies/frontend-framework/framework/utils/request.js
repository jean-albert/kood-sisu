//frontend-framework/framework/utils/request.js

import Logger from '../logger.js'; // make sure Logger is imported, if used
export const memoryCache = new Map(); // In-memory cache for storing responses (Map)

const circuitState = {
  failures: 0,               // Number of consecutive failures (количество последовательных неудач)
  lastFailureTime: 0,        // Timestamp of the last failure (время последней ошибки)
  open: false,               // Whether the circuit breaker is open (состояние «разомкнутой» цепи)
};

export async function request(endpoint, method, data = null, options = {}) {
  const {
    params,
    timeout,
    retryCount = 0,          // Number of retry attempts (количество попыток повторения)
    retryDelay = 300,        // Base delay between retries in milliseconds (начальная задержка между повторами)
    onRequest,
    onResponse,
    responseType,
    authToken,
    cacheKey,
    skipErrorLog = false,    // Whether to skip logging errors (не логировать ошибки)
    transformData,
    onError,
    metricsLabel,
    circuitBreaker,
    progressCb,         // for progress when downloading (GET)
    uploadProgressCb,   // new option for progress when uploading (POST/PUT)
    ...fetchOptions
  } = options;

  // 1. Collect query-string, URL query parameters if provided
  if (params) {
    const qs = new URLSearchParams(params).toString();
    endpoint += endpoint.includes('?') ? '&' + qs : '?' + qs;
  }

  // Circuit breaker: if open and not yet reset, reject immediately
  if (circuitBreaker && circuitState.open) {
    const timeSince = Date.now() - circuitState.lastFailureTime;
    if (timeSince < circuitBreaker.resetTimeout) {
      const err = new Error('Circuit breaker is open');
      if (onError) onError(err);
      throw err;
    } else {
      // Reset circuit breaker after timeout
      circuitState.open = false;
      circuitState.failures = 0;
    }
  }

  // Return cached response if available
  if (cacheKey && memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }

  // Offline fallback support
  if ('offlineFallback' in options && !navigator.onLine) {
    const fb = typeof options.offlineFallback === 'function'
      ? options.offlineFallback()
      : options.offlineFallback;
    return fb;
  }

  // Setup for request abortion on timeout
  const controller = new AbortController();
  if (timeout > 0) {
    setTimeout(() => controller.abort(), timeout);
  }

  // Build fetch configuration
  const config = {
    method,
    headers: {
      // For regular JSON requests, but in case of upload we will redefine below
      'Content-Type': data && !(data instanceof Blob) ? 'application/json' : undefined,
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      ...(options.requestId ? { 'X-Request-Id': options.requestId } : {}),
      ...fetchOptions.headers,
    },
    credentials: fetchOptions.credentials || 'same-origin',
    mode: fetchOptions.mode || 'cors',
    cache: fetchOptions.cache || 'default',
    redirect: fetchOptions.redirect || 'follow',
    referrerPolicy: fetchOptions.referrerPolicy || 'no-referrer-when-downgrade',
    signal: fetchOptions.signal || controller.signal,
    ...fetchOptions,
  };

  // Handle large Blob uploads in chunks with progress callback. If this is POST/PUT and we are sending Blob, then we send it in chunks:
  const isUpload = uploadProgressCb && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT');
  if (isUpload && data instanceof Blob) {
    // Start «splitting» into chunks and sending
    const total = data.size;
    let uploaded = 0;
    const chunkSize = Math.ceil(total / 20); // split into 20 chunks
    for (let start = 0; start < total; start += chunkSize) {
      const slice = data.slice(start, start + chunkSize);
      // Send only the body without JSON.stringify
      await fetch(endpoint, {
        method,
        headers: {
          // save other headers (e.g. Authorization), but not Content-Type
          ...config.headers,
          'Content-Type': slice.type || 'application/octet-stream'
        },
        body: slice,
        signal: config.signal,
      });
      uploaded += slice.size;
      try {
        uploadProgressCb(uploaded, total);
      } catch (hookErr) {
        Logger.warn('Error in uploadProgressCb:', hookErr); // "Error in uploadProgressCb:"
      }
    }
    // After «chunking» is complete, return a simple object
    return { success: true };
  }

  // 8. If method !== GET and not Blob, then serialize JSON
  let payload = null;
  // Serialize non-GET data, applying any transform if provided
  if (data !== null && method.toUpperCase() !== 'GET') {
    const toSend = transformData ? transformData(data) : data;
    payload = toSend;
    config.body = JSON.stringify(payload);
  }

  // Invoke onRequest hook if present
  if (typeof onRequest === 'function') {
    try {
      onRequest(config, endpoint);
    } catch (hookErr) {
      Logger.warn('Error in onRequest hook:', hookErr); // "Error in onRequest hook:"
    }
  }

  // Start timing metric if label is given
  if (metricsLabel) {
    console.time(`Request ${metricsLabel}`);
  }

  // Internal function to attempt the fetch, with retry logic
  async function tryRequest(attempt = 0) {
    try {
      const response = await fetch(endpoint, config);

      // Invoke onResponse hook if present
      if (typeof onResponse === 'function') {
        try {
          onResponse(response);
        } catch (hookErr) {
          Logger.warn('Error in onResponse hook:', hookErr); // Error in onResponse hook:"
        }
      }

      // Optionally ignore certain status codes
      if (Array.isArray(options.ignoreStatus) && options.ignoreStatus.includes(response.status)) {
        return null;
      }

      // Throw on HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      // Handle streaming download with progress callback
      if (progressCb && response.body && response.body.getReader) {
        const reader = response.body.getReader();
        const contentLength = +response.headers.get('Content-Length') || 0;
        let received = 0;
        const chunks = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          try {
            progressCb(received, contentLength);
          } catch (hookErr) {
            Logger.warn('Error in progressCb:', hookErr); // "Error in progressCb:"
          }
        }

        const blob = new Blob(chunks);
        if (responseType === 'blob') return blob;
        if (responseType === 'text') return await blob.text();
        if (responseType === 'formData') {
          const text = await blob.text();
          return new URLSearchParams(text);
        }
        const text = await blob.text();
        return JSON.parse(text);
      }

      // 12. Regular JSON/text/blob/etc. handling,  Default response parsing based on responseType
      let result;
      switch (responseType) {
        case 'text':
          result = await response.text();
          break;
        case 'blob':
          result = await response.blob();
          break;
        case 'formData':
          result = await response.formData();
          break;
        default:
          result = await response.json();
      }

      // Cache the result if key provided
      if (cacheKey) {
        memoryCache.set(cacheKey, result);
      }

      // End timing metric
      if (metricsLabel) {
        console.timeEnd(`Request ${metricsLabel}`);
      }

      // Reset circuit breaker on success
      if (circuitBreaker) {
        circuitState.failures = 0;
        circuitState.open = false;
      }

      return result;
    } catch (err) {

      // Handle abort (timeout) errors
      if (err.name === 'AbortError') {
        const msg = `Request aborted due to timeout (${timeout} ms): ${endpoint}`; //"Request aborted due to timeout"
        if (!skipErrorLog) Logger.error(msg);
        if (onError) onError(err);
        throw err;
      }

      // Retry logic with exponential backoff
      if (attempt < retryCount) {
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
        return tryRequest(attempt + 1);
      }

      // Circuit breaker on repeated failures
      if (circuitBreaker) {
        circuitState.failures += 1;
        circuitState.lastFailureTime = Date.now();
        if (circuitState.failures >= circuitBreaker.failureThreshold) {
          circuitState.open = true;
        }
      }

      const errMsg = `Error performing ${method} request: ${err.message}`; // Error performing ... request
      if (!skipErrorLog) Logger.error(errMsg, err.stack);
      if (onError) onError(err);
      throw err;
    }
  }

  return tryRequest();
}
