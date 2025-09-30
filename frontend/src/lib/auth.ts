import { apiClient } from './api';

export interface LoginRequest {
  username: string; // This is email, but OAuth2 uses 'username'
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  currency?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  currency: string;
  created_at: string;
  updated_at?: string;
  is_active: boolean;
}

export class AuthAPI {
  static async login(credentials: LoginRequest): Promise<TokenResponse> {
    // FastAPI OAuth2PasswordRequestForm expects form data
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/token`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  }

  static async register(userData: RegisterRequest): Promise<User> {
    return apiClient.post<User>('/register', userData);
  }

  static async getCurrentUser(token: string): Promise<User> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return response.json();
  }
}