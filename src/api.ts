
// src/api.ts
import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for development
const API_URL: string | undefined = import.meta.env.VITE_API_URL;
const DEFAULT_API_BASE = 'http://localhost:4000/api';
export const API_BASE = API_URL ? `${API_URL}/api` : DEFAULT_API_BASE;

// Simple axios helper for ad-hoc calls
export const fetchUsers = () => axios.get(`${API_BASE}/users`);

// Generic API call helper with automatic token injection
export const apiCall = async (endpoint: string, method: string = 'GET', data?: any, token?: string) => {
  // Get token from prop OR from localStorage
  const finalToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(finalToken && { Authorization: `Bearer ${finalToken}` }),
    },
    ...(data && { body: JSON.stringify(data) }),
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.error || 'Request failed');
  }
  
  return res.json();
};

export const api = {
  async register(data: any) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Registration failed');
    return res.json();
  },

  async login(credential: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential, password }),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  async getLoans(userId: string, token: string) {
    const res = await fetch(`${API_BASE}/loans?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch loans');
    return res.json();
  },

  async updateProfile(data: any, token?: string) {
    return apiCall('/auth/me', 'PUT', data, token);
  },

  // Content management methods
    async getContent(type: 'news' | 'events', token?: string) {
      return apiCall(`/content/${type}`, 'GET', undefined, token);
    },

    async createContent(type: 'news' | 'events', data: any, token?: string) {
      return apiCall(`/content/${type}`, 'POST', data, token);
    },

    async updateContent(type: 'news' | 'events', id: string, data: any, token?: string) {
      return apiCall(`/content/${type}/${id}`, 'PUT', data, token);
    },


    async deleteContent(type: 'news' | 'events', id: string, token?: string) {
      return apiCall(`/content/${type}/${id}`, 'DELETE', undefined, token);
    },

    // Mentorship methods
    async getMentors(filters?: { field?: string; search?: string }, token?: string) {
      const params = new URLSearchParams();
      if (filters?.field) params.append('field', filters.field);
      if (filters?.search) params.append('search', filters.search);
      
      const queryString = params.toString();
      const endpoint = `/mentors${queryString ? `?${queryString}` : ''}`;
      return apiCall(endpoint, 'GET', undefined, token);
    },

    async getMyMentors(token?: string) {
      return apiCall('/mentors/my-mentors', 'GET', undefined, token);
    },


    async requestMentor(mentorId: string, token?: string) {
      return apiCall('/mentors/request', 'POST', { mentorId }, token);
    },

    async getStudentsByField(field: string, token?: string) {
      return apiCall(`/mentors/students-by-field?field=${encodeURIComponent(field)}`, 'GET', undefined, token);
    },

    async approveMentorRequest(studentId: string, token?: string) {
      return apiCall('/mentors/approve', 'POST', { studentId }, token);
    },

    async rejectMentorRequest(studentId: string, token?: string) {
      return apiCall('/mentors/reject', 'POST', { studentId }, token);
    },

    async getApprovedMentees(token?: string) {
      return apiCall('/mentors/my-approved-mentees', 'GET', undefined, token);
    },

    async removeApprovedMentee(studentId: string, token?: string) {
      return apiCall('/mentors/remove-approved', 'POST', { studentId }, token);
    },
};
