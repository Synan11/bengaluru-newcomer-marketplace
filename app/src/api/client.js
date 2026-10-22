import { API_BASE_URL, getStoredToken, setStoredToken } from '../config';

export async function apiRequest(endpoint, options = {}) {
  const token = await getStoredToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    Accept: 'application/json',
    ...(options.headers || {})
  };

  // Only add Content-Type: application/json if body is not FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      await setStoredToken(null);
      throw new Error('Session expired. Please log in again.');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`[API ERROR] ${endpoint}:`, error.message);
    throw error;
  }
}
