import React, { createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
export interface Account {
  id: number;
  name: string;
  balance: number;
  icon: string;
  color: string;
  type: "checking" | "savings" | "wallet" | "credit_card";
}

export interface Transaction {
  id: number;
  account_id: number;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
  installments?: number;
  current_installment?: number;
  parent_id?: number;
  recurring?: boolean;
  recurring_day?: number;
}

export interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
  icon: string;
  budget_limit?: number;
}

export interface CreditCard {
  id: number;
  name: string;
  icon: string;
  limit: number;
  used: number;
  closing_day: number;
  due_day: number;
  color: string;
}

export interface Goal {
  id: number;
  name: string;
  target: number;
  current: number;
  deadline?: string;
  color: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "warning" | "info" | "success" | "danger";
  date: string;
  read: boolean;
}

export interface MonthlyPlan {
  id: string;
  month: string;
  expectedIncome: number;
  expectedExpense: number;
  notes: string;
}

export interface Settings {
  userName: string;
  email: string;
  currency: string;
  language: string;
  notificationsEnabled: boolean;
  alertDaysBefore: number;
  monthlyBudget: number;
  darkMode: boolean;
}

// Helpers
export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';

const getAuthHeaders = (isJson = true) => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const fetchAccounts = async (): Promise<Account[]> => {
  const res = await fetch(`${API_BASE}/accounts`, { headers: getAuthHeaders(false) });
  if (!res.ok) throw new Error('Failed to fetch accounts');
  return res.json();
};

const createAccount = async (account: Omit<Account, 'id'>): Promise<Account> => {
  const res = await fetch(`${API_BASE}/accounts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(account),
  });
  if (!res.ok) throw new Error('Failed to create account');
  return res.json();
};

const updateAccount = async (account: Account): Promise<Account> => {
  const res = await fetch(`${API_BASE}/accounts/${account.id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(account),
  });
  if (!res.ok) throw new Error('Failed to update account');
  return res.json();
};

const deleteAccount = async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE}/accounts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(false),
  });
  if (!res.ok) throw new Error('Failed to delete account');
};

const fetchCategories = async (): Promise<Category[]> => {
  const res = await fetch(`${API_BASE}/categories`, { headers: getAuthHeaders(false) });
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
};

const createCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(category),
  });
  if (!res.ok) throw new Error('Failed to create category');
  return res.json();
};

const fetchTransactions = async (): Promise<Transaction[]> => {
  const res = await fetch(`${API_BASE}/transactions`, { headers: getAuthHeaders(false) });
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
};

const createTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
  const res = await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(transaction),
  });
  if (!res.ok) throw new Error('Failed to create transaction');
  return res.json();
};

const deleteTransaction = async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(false),
  });
  if (!res.ok) throw new Error('Failed to delete transaction');
};

const fetchCreditCards = async (): Promise<CreditCard[]> => {
  const res = await fetch(`${API_BASE}/credit-cards`, { headers: getAuthHeaders(false) });
  if (!res.ok) throw new Error('Failed to fetch credit cards');
  return res.json();
};

const createCreditCard = async (card: Omit<CreditCard, 'id'>): Promise<CreditCard> => {
  const res = await fetch(`${API_BASE}/credit-cards`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(card),
  });
  if (!res.ok) throw new Error('Failed to create credit card');
  return res.json();
};

const fetchGoals = async (): Promise<Goal[]> => {
  const res = await fetch(`${API_BASE}/goals`, { headers: getAuthHeaders(false) });
  if (!res.ok) throw new Error('Failed to fetch goals');
  return res.json();
};

const fetchSettings = async (): Promise<Settings> => {
  const res = await fetch(`${API_BASE}/settings`, { headers: getAuthHeaders(false) });
  if (!res.ok) throw new Error('Failed to fetch settings');
  const data = await res.json();
  return {
    userName: data.userName || data.user_name || '',
    email: data.email || '',
    currency: data.currency || 'BRL',
    language: data.language || 'pt-BR',
    notificationsEnabled: data.notificationsEnabled ?? data.notifications_enabled ?? true,
    alertDaysBefore: data.alertDaysBefore ?? data.alert_days_before ?? 3,
    monthlyBudget: data.monthlyBudget ?? data.monthly_budget ?? 8000,
    darkMode: data.darkMode ?? data.dark_mode ?? true,
  };
};

const fetchNotifications = async (): Promise<Notification[]> => {
  const res = await fetch(`${API_BASE}/notifications`, { headers: getAuthHeaders(false) });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
};

const updateSettings = async (settings: Settings): Promise<Settings> => {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
};

const createGoal = async (goal: Omit<Goal, 'id'>): Promise<Goal> => {
  const res = await fetch(`${API_BASE}/goals`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(goal),
  });
  if (!res.ok) throw new Error('Failed to create goal');
  return res.json();
};

// Context
const FinanceContext = createContext<any>(null);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  // Queries
  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: fetchAccounts });
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const transactionsQuery = useQuery({ queryKey: ['transactions'], queryFn: fetchTransactions });
  const creditCardsQuery = useQuery({ queryKey: ['credit-cards'], queryFn: fetchCreditCards });
  const goalsQuery = useQuery({ queryKey: ['goals'], queryFn: fetchGoals });
  const settingsQuery = useQuery({ queryKey: ['settings'], queryFn: fetchSettings });
  const notificationsQuery = useQuery({ queryKey: ['notifications'], queryFn: fetchNotifications });

  // Mutations
  const createAccountMutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  });

  const updateAccountMutation = useMutation({
    mutationFn: updateAccount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  });

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const createTransactionMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });

  const createCreditCardMutation = useMutation({
    mutationFn: createCreditCard,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['credit-cards'] }),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  const createGoalMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });

  const value = {
    accounts: accountsQuery.data || [],
    categories: categoriesQuery.data || [],
    transactions: transactionsQuery.data || [],
    creditCards: creditCardsQuery.data || [],
    goals: goalsQuery.data || [],
    settings: settingsQuery.data || {
      userName: "Duda",
      email: "duda@email.com",
      currency: "BRL",
      language: "pt-BR",
      notificationsEnabled: true,
      alertDaysBefore: 3,
      monthlyBudget: 8000,
      darkMode: true,
    },
    notifications: notificationsQuery.data || [],
    isLoading: accountsQuery.isLoading || categoriesQuery.isLoading || transactionsQuery.isLoading || creditCardsQuery.isLoading || goalsQuery.isLoading || settingsQuery.isLoading || notificationsQuery.isLoading,
    createAccount: createAccountMutation.mutate,
    updateAccount: updateAccountMutation.mutate,
    deleteAccount: deleteAccountMutation.mutate,
    createCategory: createCategoryMutation.mutate,
    createTransaction: createTransactionMutation.mutate,
    deleteTransaction: deleteTransactionMutation.mutate,
    createCreditCard: createCreditCardMutation.mutate,
    updateSettings: updateSettingsMutation.mutate,
    createGoal: createGoalMutation.mutate,
    getTotalBalance: () => (accountsQuery.data || []).reduce((sum, acc) => sum + acc.balance, 0),
    getTotalIncome: (month?: string) => {
      const txns = transactionsQuery.data || [];
      const filtered = month ? txns.filter(t => t.type === 'income' && t.date.startsWith(month)) : txns.filter(t => t.type === 'income');
      return filtered.reduce((sum, t) => sum + t.amount, 0);
    },
    getTotalExpenses: (month?: string) => {
      const txns = transactionsQuery.data || [];
      const filtered = month ? txns.filter(t => t.type === 'expense' && t.date.startsWith(month)) : txns.filter(t => t.type === 'expense');
      return filtered.reduce((sum, t) => sum + t.amount, 0);
    },
    getCategorySpending: (categoryId: number, month?: string) => {
      const txns = transactionsQuery.data || [];
      const filtered = month ? txns.filter(t => t.category === categoryId.toString() && t.date.startsWith(month)) : txns.filter(t => t.category === categoryId.toString());
      return filtered.reduce((sum, t) => sum + t.amount, 0);
    },
    getUnreadNotifications: () => {
      return (notificationsQuery.data || []).filter(n => !n.read).length;
    },
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within FinanceProvider');
  }
  return context;
};
