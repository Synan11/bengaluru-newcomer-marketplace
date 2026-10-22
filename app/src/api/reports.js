import { apiRequest } from './client';

export async function submitReport(reportData) {
  return await apiRequest('/reports', {
    method: 'POST',
    body: JSON.stringify(reportData)
  });
}
