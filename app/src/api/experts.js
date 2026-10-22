import { apiRequest } from './client';

export async function searchExperts(params = {}) {
  const query = new URLSearchParams();
  if (params.needs && params.needs.length > 0) query.append('needs', params.needs.join(','));
  if (params.area) query.append('area', params.area);
  if (params.languages && params.languages.length > 0) query.append('language', params.languages.join(','));
  if (params.day) query.append('day', params.day);
  if (params.slot) query.append('slot', params.slot);
  if (params.strict) query.append('strict', 'true');
  if (params.category) query.append('category', params.category);

  return await apiRequest(`/experts/search?${query.toString()}`);
}

export async function getExpertById(expertId) {
  return await apiRequest(`/experts/${expertId}`);
}

export async function getExpertReviews(expertId) {
  return await apiRequest(`/experts/${expertId}/reviews`);
}

export async function getMyExpertProfile() {
  return await apiRequest('/experts/me/profile');
}

export async function updateMyExpertProfile(data) {
  return await apiRequest('/experts/me/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function updateAvailabilitySlots(slots) {
  return await apiRequest('/experts/me/availability', {
    method: 'PUT',
    body: JSON.stringify({ slots })
  });
}

export async function applyExpertVerification(formData) {
  return await apiRequest('/experts/apply', {
    method: 'POST',
    body: formData
  });
}
