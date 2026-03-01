import axios from "axios";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableStatus = (status) => status === 408 || status === 429 || status >= 500;

export const getJsonWithRetry = async (
  url,
  { retries = 2, timeoutMs = 5000, headers = {} } = {}
) => {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await axios.get(url, { timeout: timeoutMs, headers });
      return response.data;
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      const shouldRetry = attempt < retries && (!status || isRetryableStatus(status));
      if (!shouldRetry) {
        throw error;
      }
      await sleep(250 * (attempt + 1));
    }
  }

  throw lastError;
};

