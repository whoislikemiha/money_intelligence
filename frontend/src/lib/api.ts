const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Get token from localStorage
    const token = localStorage.getItem('token');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('API Error:', response.status, errorBody);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

import { Account, Transaction, TransactionCreate, TransactionUpdate, Category, CategoryCreate, CategoryUpdate, Budget, BudgetCreate, BudgetUpdate, Tag, TagCreate, TagUpdate } from './types';

// Account API functions
export const accountApi = {
  getMyAccount: (): Promise<Account> =>
    apiClient.get('/account/'),

  updateInitialBalance: (initial_balance: number): Promise<Account> =>
    apiClient.put('/account/initial-balance', { initial_balance }),
};

// Transaction API functions
export const transactionApi = {
  getAll: (): Promise<Transaction[]> =>
    apiClient.get('/transaction/'),

  create: (data: TransactionCreate): Promise<Transaction> =>
    apiClient.post('/transaction/', data),

  update: (id: number, data: TransactionUpdate): Promise<Transaction> =>
    apiClient.put(`/transaction/${id}`, data),

  delete: (id: number): Promise<void> =>
    apiClient.delete(`/transaction/${id}`),
};

// Category API functions
export const categoryApi = {
  getAll: (): Promise<Category[]> =>
    apiClient.get('/category/'),

  create: (data: CategoryCreate): Promise<void> =>
    apiClient.post('/category/', data),

  update: (id: number, data: CategoryUpdate): Promise<Category> =>
    apiClient.put(`/category/${id}`, data),

  delete: (id: number): Promise<void> =>
    apiClient.delete(`/category/${id}`),
};

// Budget API functions
export const budgetApi = {
  getAll: (): Promise<Budget[]> =>
    apiClient.get('/budget/'),

  getAllWithSpending: (month?: number, year?: number): Promise<Budget[]> => {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/budget/with-spending${query}`);
  },

  getById: (id: number): Promise<Budget> =>
    apiClient.get(`/budget/${id}`),

  getByCategory: (categoryId: number): Promise<Budget> =>
    apiClient.get(`/budget/category/${categoryId}`),

  create: (data: BudgetCreate): Promise<Budget> =>
    apiClient.post('/budget/', data),

  update: (id: number, data: BudgetUpdate): Promise<Budget> =>
    apiClient.put(`/budget/${id}`, data),

  delete: (id: number): Promise<void> =>
    apiClient.delete(`/budget/${id}`),
};

// Tag API functions
export const tagApi = {
  getAll: (): Promise<Tag[]> =>
    apiClient.get('/tag/'),

  getById: (id: number): Promise<Tag> =>
    apiClient.get(`/tag/${id}`),

  create: (data: TagCreate): Promise<Tag> =>
    apiClient.post('/tag/', data),

  update: (id: number, data: TagUpdate): Promise<Tag> =>
    apiClient.put(`/tag/${id}`, data),

  delete: (id: number): Promise<void> =>
    apiClient.delete(`/tag/${id}`),
};