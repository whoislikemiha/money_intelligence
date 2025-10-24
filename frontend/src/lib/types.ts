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

// Reminder types
export enum ReminderRecurrence {
  NONE = "none",
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly"
}

export interface Reminder {
  id: number;
  user_id: number;
  account_id: number;
  category_id?: number;
  name: string;
  description?: string;
  type: TransactionType;
  amount: number;
  reminder_date: string;
  recurrence: ReminderRecurrence;
  is_completed: boolean;
  transaction_id?: number;
  created_at: string;
  updated_at?: string;
  tags?: Tag[];
}

export interface ReminderCreate {
  account_id: number;
  category_id?: number;
  name: string;
  description?: string;
  type: TransactionType;
  amount: number;
  reminder_date: string;
  recurrence?: ReminderRecurrence;
  user_id: number;
  tags?: number[];
}

export interface ReminderUpdate {
  account_id?: number;
  category_id?: number;
  name?: string;
  description?: string;
  type?: TransactionType;
  amount?: number;
  reminder_date?: string;
  recurrence?: ReminderRecurrence;
  is_completed?: boolean;
  transaction_id?: number;
  tags?: number[];
}

// Savings Goal types
export interface SavingsGoal {
  id: number;
  user_id: number;
  name: string;
  target_amount?: number;
  color: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  current_amount?: number;
}

export interface SavingsGoalCreate {
  name: string;
  target_amount?: number;
  color?: string;
  notes?: string;
  user_id: number;
}

export interface SavingsGoalUpdate {
  name?: string;
  target_amount?: number;
  color?: string;
  notes?: string;
}

export interface SavingsTransaction {
  id: number;
  savings_goal_id: number;
  amount: number;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface SavingsTransactionCreate {
  savings_goal_id: number;
  amount: number;
  description?: string;
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

// Assistant types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  tool_name: string;
  tool_input: any;
  tool_output?: any;
  status: 'pending' | 'running' | 'success' | 'error';
  error?: string;
}

export interface ChatRequest {
  message: string;
  account_id: number;
  conversation_id?: string;
}

export interface ChatResponse {
  message: string;
  conversation_id: string;
  tool_calls?: ToolCall[];
}

// SSE Event types
export type ChatEvent =
  | { type: 'thinking' }
  | { type: 'tool_start'; tool_name: string; tool_input: any }
  | { type: 'tool_end'; tool_name: string; tool_output: any; success: boolean; error?: string }
  | { type: 'message_chunk'; content: string; is_final: boolean }
  | { type: 'transaction_previews'; transactions: TransactionPreview[]; count: number }
  | { type: 'done'; conversation_id: string }
  | { type: 'error'; message: string; recoverable: boolean };