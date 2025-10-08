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

import { Account, AccountCreate, AccountUpdate, MonthlyStats, Transaction, TransactionCreate, TransactionUpdate, Category, CategoryCreate, CategoryUpdate, Budget, BudgetCreate, BudgetUpdate, Tag, TagCreate, TagUpdate, AgentProcessRequest, AgentProcessResponse } from './types';

// Account API functions
export const accountApi = {
  getAll: (): Promise<Account[]> =>
    apiClient.get('/account/'),

  getById: (id: number): Promise<Account> =>
    apiClient.get(`/account/${id}`),

  create: (data: AccountCreate): Promise<Account> =>
    apiClient.post('/account/', data),

  update: (id: number, data: AccountUpdate): Promise<Account> =>
    apiClient.put(`/account/${id}`, data),

  delete: (id: number): Promise<void> =>
    apiClient.delete(`/account/${id}`),

  getMonthlyStats: (accountId?: number): Promise<MonthlyStats> => {
    const params = accountId ? `?account_id=${accountId}` : '';
    return apiClient.get(`/account/monthly-stats/${params}`);
  },
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

// Agent API functions
export const agentApi = {
  processText: (data: AgentProcessRequest): Promise<AgentProcessResponse> =>
    apiClient.post('/agent/process', data),

  /**
   * Stream transaction previews as they are created.
   * Uses Server-Sent Events (SSE) for real-time updates.
   *
   * @param data - Request data with text and account_id
   * @param onEvent - Callback invoked for each event (planning, transaction_start, transaction, done, error)
   * @returns Cleanup function to close the stream
   */
  processTextStream: (
    data: AgentProcessRequest,
    onEvent: (event: any) => void
  ): (() => void) => {
    const token = localStorage.getItem('token');
    const url = `${API_BASE_URL}/agent/process-stream`;

    // Create EventSource with POST data via URL params (workaround for EventSource POST limitation)
    // Or use fetch with streaming
    let controller = new AbortController();

    const streamWithFetch = async () => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(data),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // Process any remaining data in buffer
              if (buffer.trim()) {
                const dataMatch = buffer.match(/^data: (.+)$/m);
                if (dataMatch) {
                  try {
                    const event = JSON.parse(dataMatch[1]);
                    onEvent(event);
                  } catch (e) {
                    console.error('Failed to parse SSE message:', e);
                  }
                }
              }
              break;
            }

            // Decode the chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE messages (separated by \n\n)
            const messages = buffer.split('\n\n');
            buffer = messages.pop() || ''; // Keep incomplete message in buffer

            for (const message of messages) {
              if (!message.trim()) continue;

              // Parse SSE format: "data: {...}"
              const dataMatch = message.match(/^data: (.+)$/m);
              if (dataMatch) {
                try {
                  const event = JSON.parse(dataMatch[1]);
                  onEvent(event);
                } catch (e) {
                  console.error('Failed to parse SSE message:', e);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Stream error:', error);
          onEvent({ type: 'error', message: error.message || 'Stream failed' });
        }
      }
    };

    streamWithFetch();

    // Return cleanup function
    return () => {
      controller.abort();
    };
  },
};