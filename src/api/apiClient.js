// @ts-nocheck
const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:3000/api';
const getToken = () => localStorage.getItem('token');

const request = async (method, endpoint, body = null, params = null) => {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  if (params) {
    const q = new URLSearchParams();
    for (const key in params) if (params[key]) q.append(key, params[key]);
    const qs = q.toString();
    if (qs) endpoint += `?${qs}`;
  }

  // Handle FormData for file uploads (legacy proxy compat)
  if (body instanceof FormData) {
    delete headers['Content-Type'];
    const options = { method, headers, body };
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await response.json();
  
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
};

export const api = {
  auth: {
    signup: (name, email, password) => 
      request('POST', '/auth/signup', { name, email, password }),
    login: (email, password) => 
      request('POST', '/auth/login', { email, password }),
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  },
  smtp: {
    list: () => request('GET', '/smtp'),
    create: (data) => request('POST', '/smtp', data),
    update: (id, data) => request('PUT', `/smtp/${id}`, data),
    delete: (id) => request('DELETE', `/smtp/${id}`),
    test: (data) => request('POST', '/smtp/test', data),
    toggleWarmup: (id) => request('POST', `/smtp/${id}/warmup/toggle`),
    runWarmup: (id) => request('POST', `/smtp/${id}/warmup/run`),
    warmupStatus: (id) => request('GET', `/smtp/${id}/warmup/status`),
  },
  campaigns: {
    list: () => request('GET', '/campaigns'),
    get: (id) => request('GET', `/campaigns/${id}`),
    create: (data) => request('POST', '/campaigns', data),
    update: (id, data) => request('PUT', `/campaigns/${id}`, data),
    delete: (id) => request('DELETE', `/campaigns/${id}`),
    start: (id) => request('POST', `/campaigns/${id}/start`),
    pause: (id) => request('POST', `/campaigns/${id}/pause`),
    resume: (id) => request('POST', `/campaigns/${id}/resume`),
    clone: (id) => request('POST', `/campaigns/${id}/clone`),
    logs: (id) => request('GET', `/campaigns/${id}/logs`),
    analytics: (id) => request('GET', `/campaigns/${id}/analytics`),
    testSend: (data) => request('POST', '/campaigns/test-send', data),
    repliedContacts: (id) => request('GET', `/campaigns/${id}/replied-contacts`),
  },
  contacts: {
    list: (listId) => request('GET', `/contacts${listId ? '?list_id='+listId : ''}`),
    get: (id) => request('GET', `/contacts/${id}`),
    create: (data) => request('POST', '/contacts', data),
    update: (id, data) => request('PUT', `/contacts/${id}`, data),
    delete: (id) => request('DELETE', `/contacts/${id}`),
    bulkCreate: (listId, file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('list_id', listId);
      return fetch(`${API_BASE}/contacts/bulk`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${getToken()}` 
        },
        body: formData
      }).then(r => r.json());
    }
  },
  lists: {
    list: () => request('GET', '/lists'),
    get: (id) => request('GET', `/lists/${id}`),
    create: (data) => request('POST', '/lists', data),
    update: (id, data) => request('PUT', `/lists/${id}`, data),
    delete: (id) => request('DELETE', `/lists/${id}`),
  },
  ai: {
    generate: (prompt) => request('POST', '/ai/generate', { prompt })
  },
  templates: {
    list: () => request('GET', '/templates'),
    create: (data) => request('POST', '/templates', data),
    update: (id, data) => request('PUT', `/templates/${id}`, data),
    delete: (id) => request('DELETE', `/templates/${id}`),
  },
  drip: {
    list: () => request('GET', '/drip-sequences'),
    create: (data) => request('POST', '/drip-sequences', data),
    update: (id, data) => request('PUT', `/drip-sequences/${id}`, data),
    delete: (id) => request('DELETE', `/drip-sequences/${id}`),
    start: (id) => request('POST', `/drip-sequences/${id}/start`),
  },
  dashboard: {
    stats: () => request('GET', '/dashboard/stats'),
  },
  activity: {
    list: () => request('GET', '/activity'),
    replies: () => request('GET', '/activity/replies'),
  },
  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    return response.json();
  }
};

export const auth = api.auth;
export default api;
