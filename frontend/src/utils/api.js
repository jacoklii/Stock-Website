// [AI] API Client - Shared axios instance for all API calls
// Provides base URL, JWT injection via interceptors. Domain modules use this client.

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to all requests if present in localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Helper to normalize API responses to { data, error } contract.
 * Non-2xx responses populate error; success responses populate data.
 * @param {Promise} promise - Axios request promise
 * @returns {Promise<{data?: any, error?: any}>}
 */
export const toDataError = async (promise) => {
  try {
    const response = await promise;
    return { data: response.data, error: null };
  } catch (err) {
    const error = err.response?.data || { message: err.message };
    return { data: null, error };
  }
};

export default apiClient;
