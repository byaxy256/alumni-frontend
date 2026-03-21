
/// <reference types="vite/client" />
// src/api.ts
import axios from 'axios';

// Use environment variable for API URL, fallback to Render backend
const API_URL: string | undefined = import.meta.env.VITE_API_URL;
const DEFAULT_API_BASE = 'https://alumni-backend-mupt.onrender.com/api';
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

  async login(credential: string, password: string, adminSecret?: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(adminSecret && { 'x-admin-secret': adminSecret })
      },
      body: JSON.stringify({ credential, password, adminSecret }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({} as any));
      throw new Error(error.error || error.message || 'Login failed');
    }
    return res.json();
  },

  async requestLogin2FA(credential: string, adminSecret?: string) {
    const res = await fetch(`${API_BASE}/auth/login/2fa/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminSecret && { 'x-admin-secret': adminSecret }),
      },
      body: JSON.stringify({ credential, adminSecret }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({} as any));
      const err: any = new Error(error.error || error.message || 'Failed to request 2FA code');
      err.status = res.status;
      throw err;
    }

    return res.json();
  },

  async loginWith2FA(credential: string, password: string, twoFactorCode: string, adminSecret?: string) {
    const res = await fetch(`${API_BASE}/auth/login/2fa/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminSecret && { 'x-admin-secret': adminSecret }),
      },
      body: JSON.stringify({ credential, password, twoFactorCode, adminSecret }),
    });

    if (res.status === 404) {
      return this.login(credential, password, adminSecret);
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({} as any));
      throw new Error(error.error || error.message || '2FA verification failed');
    }

    return res.json();
  },

  /**
   * Exchange Firebase Google ID token for app JWT (backend: POST /api/auth/google).
   * Optional requestedRole helps new users sign up as student vs alumni when the backend supports it.
   */
  async loginWithGoogle(idToken: string, requestedRole?: 'student' | 'alumni') {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, requestedRole }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({} as any));
      throw new Error(error.error || error.message || 'Google sign-in failed');
    }
    return res.json() as Promise<{
      success: boolean;
      token: string;
      user: any;
    }>;
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


    async requestMentor(mentorUid: string, token?: string, field?: string) {
      // Backend expects mentorUid (not mentorId) in the payload
      return apiCall('/mentors/request', 'POST', { mentorUid, field }, token);
    },

    async getMyMentorRequests(token?: string) {
      return apiCall('/mentors/my-requests', 'GET', undefined, token);
    },

    async cancelMentorRequest(assignmentId: string, token?: string) {
      return apiCall('/mentors/cancel-request', 'POST', { assignmentId }, token);
    },

    async getStudentsByField(field: string, token?: string) {
      return apiCall(`/mentors/students-by-field?field=${encodeURIComponent(field)}`, 'GET', undefined, token);
    },

    async approveMentorRequest(studentUid: string, token?: string) {
      return apiCall('/mentors/approve', 'POST', { studentId: studentUid }, token);
    },

    async rejectMentorRequest(studentUid: string, token?: string) {
      return apiCall('/mentors/reject', 'POST', { studentId: studentUid }, token);
    },

    async getApprovedMentees(token?: string) {
      return apiCall('/mentors/my-approved-mentees', 'GET', undefined, token);
    },

    async removeApprovedMentee(studentUid: string, token?: string) {
      return apiCall('/mentors/remove-approved', 'POST', { studentId: studentUid }, token);
    },

    async registerPushToken(pushToken: string, platform: 'web' | 'ios' | 'android' = 'web', token?: string) {
      return apiCall('/notifications/register-token', 'POST', { token: pushToken, platform }, token);
    },
};
