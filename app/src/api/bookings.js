import { apiRequest } from './client';

export async function createBooking(bookingData) {
  return await apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData)
  });
}

export async function getMyBookings() {
  return await apiRequest('/bookings/mine');
}

export async function acceptBooking(bookingId) {
  return await apiRequest(`/bookings/${bookingId}/accept`, {
    method: 'PATCH'
  });
}

export async function rejectBooking(bookingId) {
  return await apiRequest(`/bookings/${bookingId}/reject`, {
    method: 'PATCH'
  });
}

export async function cancelBooking(bookingId) {
  return await apiRequest(`/bookings/${bookingId}/cancel`, {
    method: 'PATCH'
  });
}

export async function completeBooking(bookingId) {
  return await apiRequest(`/bookings/${bookingId}/complete`, {
    method: 'PATCH'
  });
}

export async function mockPayBooking(bookingId) {
  return await apiRequest(`/bookings/${bookingId}/pay`, {
    method: 'POST'
  });
}
