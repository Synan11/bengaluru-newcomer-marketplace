import { apiRequest } from './client';

export async function fetchServices() {
  return await apiRequest('/services');
}

export async function fetchAreas() {
  return await apiRequest('/areas');
}

export async function fetchLanguages() {
  return await apiRequest('/languages');
}
