const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.message || data?.error || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error('Unable to connect to the backend server. Please verify the API is running.');
    }
    throw err;
  }
}

export const api = {
  // Auth
  auth: {
    login: (credentials) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    me: () => request('/api/auth/me'),
  },

  // Events
  events: {
    search: (params = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, val);
        }
      });
      return request(`/api/events?${query.toString()}`);
    },
    getById: (id) => request(`/api/events/${id}`),
    getSeats: (eventId) => request(`/api/events/${eventId}/seats`),
    holdSeats: (eventId, seatNumbers) => request(`/api/events/${eventId}/holds`, {
      method: 'POST',
      body: JSON.stringify({ seatNumbers }),
    }),
    releaseHold: (eventId, seatNumbers) => request(`/api/events/${eventId}/holds`, {
      method: 'DELETE',
      body: JSON.stringify({ seatNumbers }),
    }),
  },

  // Admin Events
  adminEvents: {
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, val);
        }
      });
      return request(`/api/admin/events?${query.toString()}`);
    },
    create: (eventData) => request('/api/admin/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    }),
    update: (id, eventData) => request(`/api/admin/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    }),
    publish: (id) => request(`/api/admin/events/${id}/publish`, { method: 'PATCH' }),
    cancel: (id) => request(`/api/admin/events/${id}/cancel`, { method: 'PATCH' }),
    delete: (id) => request(`/api/admin/events/${id}`, { method: 'DELETE' }),
  },

  // Bookings
  bookings: {
    create: (bookingData) => request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    }),
    getMyBookings: () => request('/api/bookings/my'),
    getByRef: (ref) => request(`/api/bookings/${ref}`),
    cancel: (ref) => request(`/api/bookings/${ref}/cancel`, { method: 'POST' }),
    getAllAdmin: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/api/bookings/admin/all?${query}`);
    },
  },

  // Analytics
  analytics: {
    getOverview: () => request('/api/admin/analytics/overview'),
    getEvents: () => request('/api/admin/analytics/events'),
    getRevenueByCategory: () => request('/api/admin/analytics/revenue-by-category'),
    getDailySales: () => request('/api/admin/analytics/daily-sales'),
  },

  // Diagnostics & Ops
  diagnostics: {
    getHealth: () => request('/api/health'),
    getReplicaStatus: () => request('/api/ops/replica-status'),
    getQueryExplain: () => request('/api/ops/query-explain'),
    getIndexes: () => request('/api/ops/indexes'),
  },
};

