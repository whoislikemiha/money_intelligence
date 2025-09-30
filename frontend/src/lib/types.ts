// Account types
export interface Account {
  id: number;
  user_id: number;
  name: string;
  current_balance: number;
  initial_balance: number;
  created_at: string;
  updated_at: string | null;
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
  tag_ids?: number[];
}