import { apiRequest } from './client';
import { setStoredToken } from '../config';

export async function login(email, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  if (data.token) {
    await setStoredToken(data.token);
  }
  return data;
}

export async function register(userData) {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
  if (data.token) {
    await setStoredToken(data.token);
  }
  return data;
}

export async function getMe() {
  return await apiRequest('/auth/me');
}

export async function logout() {
  await setStoredToken(null);
}
