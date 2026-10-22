import { apiRequest } from './client';

export async function submitReview(bookingId, rating, comment) {
  return await apiRequest(`/reviews/${bookingId}`, {
    method: 'POST',
    body: JSON.stringify({ rating, comment })
  });
}
