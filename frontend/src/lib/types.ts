// Account types
export interface Account {
  id: number;
  user_id: number;
  name: string;
  current_balance: number;
  initial_balance: number;
  currency: string;
  created_at: string;
  updated_at: string | null;
}

export interface AccountCreate {
  name: string;
  initial_balance: number;
  currency: string;
}

export interface AccountUpdate {
  name?: string;
  initial_balance?: number;
  currency?: string;
}

export interface MonthlyStats {
  current_balance: number;
  monthly_income: number;
  monthly_expenses: number;
}

// Transaction types
export enum TransactionType {
  INCOME = "income",
  EXPENSE = "expense"
}

export interface Transaction {
  id: number;
  user_id: number;
  account_id: number;
  category_id: number;
  type: TransactionType;
  amount: number;
  description?: string;
  date: string;
  created_at: string;
  updated_at?: string;
  tags?: any[];
}

export interface TransactionCreate {
  account_id: number;
  category_id: number;
  type: TransactionType;
  amount: number;
  description?: string;
  date: string;
  user_id: number;
  tags?: number[];
}

export interface TransactionUpdate {
  account_id?: number;
  category_id?: number;
  type?: TransactionType;
  amount?: number;
  description?: string;
  date?: string;
  tags?: number[];
}

// Category types
export interface Category {
  id: number;
  user_id: number;
  name: string;
  icon?: string;
  color?: string;
  created_at: string;
  updated_at?: string;
}

export interface CategoryCreate {
  name: string;
  icon?: string;
  color?: string;
}

export interface CategoryUpdate {
  name?: string;
  icon?: string;
  color?: string;
}

// Budget types
export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
  category?: Category;
}

export interface BudgetCreate {
  category_id: number;
  amount: number;
  notes?: string;
  user_id: number;
}

export interface BudgetUpdate {
  amount?: number;
  notes?: string;
}

// Tag types
export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color?: string;
  created_at: string;
  updated_at?: string;
}

export interface TagCreate {
  name: string;
  color?: string;
  user_id: number;
}

export interface TagUpdate {
  name?: string;
  color?: string;
}

// Agent types
export interface TransactionPreview {
  amount: number;
  description: string;
  category_id: number;
  type: TransactionType;
  date: string;
  tags: number[];
}

export interface AgentProcessRequest {
  text: string;
  account_id: number;
}

export interface AgentProcessResponse {
  transactions: TransactionPreview[];
}