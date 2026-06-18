const BASE_URL = 'http://localhost:5000/api';

export async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('aegis_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData.message || response.statusText || 'API request failed';
    throw new Error(errMsg);
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  
  return null;
}
