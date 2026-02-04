// TypeScript interfaces for content management

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  content?: string;
  hasImage?: boolean;
  audience?: 'students' | 'alumni' | 'both';
  published: boolean;
  type: 'news' | 'event';
  createdAt: string;
  updatedAt?: string;
  date?: string;
  time?: string;
  location?: string;
  registrationFee?: number;
}

export interface NewsItem extends ContentItem {
  type: 'news';
  content: string;
}

export interface EventItem extends ContentItem {
  type: 'event';
  date: string;
  time: string;
  location: string;
}

export interface ContentFormData {
  title: string;
  description: string;
  content: string;
  date: string;
  time: string;
  location: string;
  registrationFee: number;
  published: boolean;
  audience: 'students' | 'alumni' | 'both';
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface ContentApiResponse {
  content: ContentItem[];
}

export interface CreateContentRequest {
  type: 'news' | 'event';
  title: string;
  description: string;
  content?: string;
  date?: string;
  time?: string;
  location?: string;
  registrationFee?: number;
  published: boolean;
  audience?: 'students' | 'alumni' | 'both';
}

export interface UpdateContentRequest extends Partial<CreateContentRequest> {
  id: string;
}

export interface ContentError {
  type: 'network' | 'validation' | 'server' | 'unknown';
  message: string;
  code?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationState {
  isValid: boolean;
  errors: ValidationError[];
}

export interface LoadingState {
  create: boolean;
  update: boolean;
  delete: boolean;
  publish: boolean;
  fetch: boolean;
}

