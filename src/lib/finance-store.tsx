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
  accountId?: number;
  creditCardId?: number;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
  installments?: number;
  currentInstallment?: number;
  parentId?: number;
  recurring?: boolean;
  recurringDay?: number;
}

export interface RecurringRule {
  id: number;
  accountId?: number;
  creditCardId?: number;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  recurringDay: number;
  active: boolean;
  startDate: string;
  endDate?: string;
  lastProcessedMonth?: string;
}

export interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
  icon: string;
  budgetLimit?: number;
}

export interface CreditCard {
  id: number;
  name: string;
  icon: string;
  limit: number;
  used: number;
  closingDay: number;
  dueDay: number;
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
  systemName: string;
}

// Helpers
export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const API_BASE = '/api';

export const getToken = () => sessionStorage.getItem('token') || localStorage.getItem('token');
export const getUser = () => {
  const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setAuthSession = (token: string, user: unknown) => {
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('user', JSON.stringify(user));
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const clearAuth = () => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const getAuthHeaders = (isJson = true) => {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const handleUnauthorized = async (res: Response) => {
  if (res.status === 401 || res.status === 403) {
    clearAuth();
    window.location.href = '/login';
    throw new Error('Sessão expirada. Faça login novamente.');
  }
  return res;
};

const fetchAccounts = async (): Promise<Account[]> => {
  const res = await fetch(`${API_BASE}/accounts`, { headers: getAuthHeaders(false) });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to fetch accounts');
  const data = await res.json();
  return data.map((a: any) => ({
    ...a,
    id: parseInt(a.id),
    balance: parseFloat(a.balance)
  }));
};

const createAccount = async (account: Omit<Account, 'id'>): Promise<Account> => {
  const res = await fetch(`${API_BASE}/accounts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(account),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to create account');
  const data = await res.json();
  return { ...data, balance: parseFloat(data.balance) };
};

const updateAccount = async (account: Account): Promise<Account> => {
  const res = await fetch(`${API_BASE}/accounts/${account.id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(account),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to update account');
  const data = await res.json();
  return { ...data, balance: parseFloat(data.balance) };
};

const deleteAccount = async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE}/accounts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(false),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to delete account');
};

const fetchCategories = async (): Promise<Category[]> => {
  const res = await fetch(`${API_BASE}/categories`, { headers: getAuthHeaders(false) });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to fetch categories');
  const data = await res.json();
  return data.map((c: any) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    icon: c.icon,
    budgetLimit: c.budget_limit ? parseFloat(c.budget_limit) : undefined,
  }));
};

const createCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...category,
      budget_limit: category.budgetLimit
    }),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to create category');
  const c = await res.json();
  return {
    id: c.id,
    name: c.name,
    type: c.type,
    icon: c.icon,
    budgetLimit: c.budget_limit ? parseFloat(c.budget_limit) : undefined,
  };
};

const deleteCategory = async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(false),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to delete category');
};

const fetchTransactions = async (): Promise<Transaction[]> => {
  const res = await fetch(`${API_BASE}/transactions`, { headers: getAuthHeaders(false) });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  const data = await res.json();
  return data.map((t: any) => ({
    id: t.id,
    accountId: t.account_id || t.accountId ? parseInt(t.account_id || t.accountId) : undefined,
    creditCardId: t.credit_card_id || t.creditCardId ? parseInt(t.credit_card_id || t.creditCardId) : undefined,
    type: t.type,
    amount: parseFloat(t.amount),
    category: t.category,
    description: t.description,
    date: t.date,
    installments: t.installments,
    currentInstallment: t.current_installment || t.currentInstallment,
    parentId: t.parent_id || t.parentId,
    recurring: t.recurring,
    recurringDay: t.recurring_day || t.recurringDay,
  }));
};

const createTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
  const res = await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(transaction),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to create transaction');
  return res.json();
};

const updateTransaction = async (id: number, transaction: Partial<Transaction>): Promise<Transaction> => {
  const res = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(transaction),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to update transaction');
  const t = await res.json();
  return {
    id: t.id,
    accountId: t.account_id || t.accountId ? parseInt(t.account_id || t.accountId) : undefined,
    creditCardId: t.credit_card_id || t.creditCardId ? parseInt(t.credit_card_id || t.creditCardId) : undefined,
    type: t.type,
    amount: parseFloat(t.amount),
    category: t.category,
    description: t.description,
    date: t.date,
    installments: t.installments,
    currentInstallment: t.current_installment || t.currentInstallment,
    parentId: t.parent_id || t.parentId,
    recurring: t.recurring,
    recurringDay: t.recurring_day || t.recurringDay,
  };
};

const deleteTransaction = async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(false),
  });
  await handleUnauthorized(res);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to delete transaction');
  }
};

const fetchCreditCards = async (): Promise<CreditCard[]> => {
  const res = await fetch(`${API_BASE}/credit-cards`, { headers: getAuthHeaders(false) });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to fetch credit cards');
  const data = await res.json();
  return data.map((cc: any) => ({
    id: cc.id,
    name: cc.name,
    icon: cc.icon,
    limit: parseFloat(cc.limit),
    used: parseFloat(cc.used),
    closingDay: cc.closing_day || cc.closingDay,
    dueDay: cc.due_day || cc.dueDay,
    color: cc.color,
  }));
};

const createCreditCard = async (card: Omit<CreditCard, 'id'>): Promise<CreditCard> => {
  const res = await fetch(`${API_BASE}/credit-cards`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(card),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to create credit card');
  const cc = await res.json();
  return {
    id: cc.id,
    name: cc.name,
    icon: cc.icon,
    limit: parseFloat(cc.limit),
    used: parseFloat(cc.used),
    closingDay: cc.closing_day || cc.closingDay,
    dueDay: cc.due_day || cc.dueDay,
    color: cc.color,
  };
};

const updateCreditCard = async (id: number, card: Partial<CreditCard>): Promise<CreditCard> => {
  const res = await fetch(`${API_BASE}/credit-cards/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(card),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to update credit card');
  const cc = await res.json();
  return {
    id: cc.id,
    name: cc.name,
    icon: cc.icon,
    limit: parseFloat(cc.limit),
    used: parseFloat(cc.used),
    closingDay: cc.closing_day || cc.closingDay,
    dueDay: cc.due_day || cc.dueDay,
    color: cc.color,
  };
};

const deleteCreditCard = async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE}/credit-cards/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(false),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to delete credit card');
};

const fetchGoals = async (): Promise<Goal[]> => {
  const res = await fetch(`${API_BASE}/goals`, { headers: getAuthHeaders(false) });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to fetch goals');
  const data = await res.json();
  return data.map((g: any) => ({
    ...g,
    target: parseFloat(g.target),
    current: parseFloat(g.current),
  }));
};

const fetchSettings = async (): Promise<Settings> => {
  const res = await fetch(`${API_BASE}/settings`, { headers: getAuthHeaders(false) });
  await handleUnauthorized(res);
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
    systemName: data.systemName || data.system_name || 'Continhas da Duda',
  };
};

const fetchNotifications = async (): Promise<Notification[]> => {
  const res = await fetch(`${API_BASE}/notifications`, { headers: getAuthHeaders(false) });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
};

const updateSettings = async (settings: Settings): Promise<Settings> => {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
};

const changePassword = async ({ currentPassword, newPassword }: { currentPassword: string, newPassword: string }): Promise<void> => {
  const res = await fetch(`${API_BASE}/settings/change-password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  await handleUnauthorized(res);
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Erro ao alterar senha');
  }
};

const createGoal = async (goal: Omit<Goal, 'id'>): Promise<Goal> => {
  const res = await fetch(`${API_BASE}/goals`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(goal),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to create goal');
  return res.json();
};

const updateGoal = async (id: number, goal: Partial<Goal>): Promise<Goal> => {
  const res = await fetch(`${API_BASE}/goals/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(goal),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to update goal');
  const g = await res.json();
  return {
    ...g,
    target: parseFloat(g.target),
    current: parseFloat(g.current),
  };
};

const deleteGoal = async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE}/goals/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(false),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to delete goal');
};

const fetchRecurringRules = async (): Promise<RecurringRule[]> => {
  const res = await fetch(`${API_BASE}/recurring-rules`, { headers: getAuthHeaders(false) });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to fetch recurring rules');
  const data = await res.json();
  return data.map((r: any) => ({
    ...r,
    accountId: r.account_id,
    creditCardId: r.credit_card_id,
    recurringDay: r.recurring_day,
    startDate: r.start_date,
    endDate: r.end_date,
    lastProcessedMonth: r.last_processed_month,
    amount: parseFloat(r.amount)
  }));
};

const createRecurringRule = async (rule: Omit<RecurringRule, 'id'>): Promise<RecurringRule> => {
  const res = await fetch(`${API_BASE}/recurring-rules`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...rule,
      account_id: rule.accountId,
      credit_card_id: rule.creditCardId,
      recurring_day: rule.recurringDay,
      end_date: rule.endDate
    }),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to create recurring rule');
  return res.json();
};

const updateRecurringRule = async (id: number, rule: Partial<RecurringRule>): Promise<RecurringRule> => {
  const res = await fetch(`${API_BASE}/recurring-rules/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...rule,
      account_id: rule.accountId,
      credit_card_id: rule.creditCardId,
      recurring_day: rule.recurringDay,
      end_date: rule.endDate
    }),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to update recurring rule');
  return res.json();
};

const deleteRecurringRule = async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE}/recurring-rules/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(false),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to delete recurring rule');
};

export interface FinanceContextType {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  getProjectedTransactions: (monthKey: string) => Transaction[];
  creditCards: CreditCard[];
  goals: Goal[];
  settings: Settings;
  notifications: Notification[];
  recurringRules: RecurringRule[];
  isLoading: boolean;
  
  // Actions
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (account: Account) => void;
  deleteAccount: (id: number) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  deleteCategory: (id: number) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<Transaction>;
  updateTransaction: (id: number, transaction: Partial<Transaction>) => Promise<Transaction>;
  deleteTransaction: (id: number) => Promise<void>;
  addCreditCard: (card: Omit<CreditCard, 'id'>) => Promise<CreditCard>;
  updateCreditCard: (id: number, card: Partial<CreditCard>) => Promise<CreditCard>;
  deleteCreditCard: (id: number) => Promise<void>;
  updateSettings: (settings: Settings) => Promise<Settings>;
  changePassword: (params: { currentPassword: string, newPassword: string }) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<Goal>;
  updateGoal: (id: number, goal: Partial<Goal>) => Promise<Goal>;
  deleteGoal: (id: number) => Promise<void>;
  addRecurringRule: (rule: Omit<RecurringRule, 'id'>) => Promise<RecurringRule>;
  updateRecurringRule: (id: number, rule: Partial<RecurringRule>) => Promise<RecurringRule>;
  deleteRecurringRule: (id: number) => Promise<void>;

  getTotalBalance: () => number;
  getTotalIncome: (monthKey?: string) => number;
  getTotalExpenses: (monthKey?: string) => number;
  getCategorySpending: (categoryName: string, monthKey?: string) => number;
  getUnreadNotifications: () => number;
}

// Context
const FinanceContext = createContext<FinanceContextType | null>(null);
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
  const recurringRulesQuery = useQuery({ queryKey: ['recurring-rules'], queryFn: fetchRecurringRules });

  const initialSettings: Settings = {
    userName: getUser()?.username || "Usuário",
    email: getUser()?.email || "",
    currency: "BRL",
    language: "pt-BR",
    notificationsEnabled: true,
    alertDaysBefore: 3,
    monthlyBudget: 8000,
    darkMode: true,
    systemName: "FinFlow Pro",
  };

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

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const createTransactionMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, transaction }: { id: number, transaction: Partial<Transaction> }) => updateTransaction(id, transaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
    },
  });

  const createCreditCardMutation = useMutation({
    mutationFn: createCreditCard,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['credit-cards'] }),
  });

  const updateCreditCardMutation = useMutation({
    mutationFn: ({ id, card }: { id: number, card: Partial<CreditCard> }) => updateCreditCard(id, card),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['credit-cards'] }),
  });

  const deleteCreditCardMutation = useMutation({
    mutationFn: deleteCreditCard,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['credit-cards'] }),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
  });

  const createGoalMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, goal }: { id: number, goal: Partial<Goal> }) => updateGoal(id, goal),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });

  const deleteGoalMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });

  const createRecurringRuleMutation = useMutation({
    mutationFn: createRecurringRule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-rules'] }),
  });

  const updateRecurringRuleMutation = useMutation({
    mutationFn: ({ id, rule }: { id: number, rule: Partial<RecurringRule> }) => updateRecurringRule(id, rule),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-rules'] }),
  });

  const deleteRecurringRuleMutation = useMutation({
    mutationFn: deleteRecurringRule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-rules'] }),
  });

  // Get virtual transactions for future months based on recurring rules
  const getProjectedTransactions = (monthKey: string): Transaction[] => {
    const rules = recurringRulesQuery.data || [];
    const existingTxs = transactionsQuery.data || [];
    
    // Only project for current or future months
    const today = new Date();
    const todayMonthKey = today.toISOString().slice(0, 7);
    if (monthKey < todayMonthKey) return [];

    const projected: Transaction[] = [];
    
    rules.forEach(rule => {
      if (!rule.active) return;
      
      // Check if already processed for this month in the DB
      const alreadyExists = existingTxs.some(t => 
        t.date.startsWith(monthKey) && 
        t.description.includes(rule.description) && 
        t.amount === rule.amount &&
        t.recurring
      );

      if (!alreadyExists) {
        // Check if the rule is still valid (not expired)
        if (rule.endDate && monthKey > rule.endDate.slice(0, 7)) return;
        if (rule.startDate && monthKey < rule.startDate.slice(0, 7)) return;

        projected.push({
          id: -(rule.id * 1000 + parseInt(monthKey.replace('-', ''))), // Virtual ID
          accountId: rule.accountId,
          creditCardId: rule.creditCardId,
          type: rule.type,
          amount: rule.amount,
          category: rule.category,
          description: `${rule.description} (Projetado)`,
          date: `${monthKey}-${String(rule.recurringDay).padStart(2, '0')}`,
          recurring: true,
          recurringDay: rule.recurringDay
        });
      }
    });

    return projected;
  };

  const value = {
    accounts: accountsQuery.data || [],
    categories: categoriesQuery.data || [],
    transactions: transactionsQuery.data || [],
    getProjectedTransactions,
    creditCards: creditCardsQuery.data || [],
    goals: goalsQuery.data || [],
    settings: settingsQuery.data ? { ...initialSettings, ...settingsQuery.data } : initialSettings,
    notifications: notificationsQuery.data || [],
    recurringRules: recurringRulesQuery.data || [],
    isLoading: accountsQuery.isLoading || categoriesQuery.isLoading || transactionsQuery.isLoading || creditCardsQuery.isLoading || goalsQuery.isLoading || settingsQuery.isLoading || notificationsQuery.isLoading || recurringRulesQuery.isLoading,
    
    // Actions
    addAccount: createAccountMutation.mutate,
    updateAccount: updateAccountMutation.mutate,
    deleteAccount: deleteAccountMutation.mutate,
    addCategory: createCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate,
    addTransaction: createTransactionMutation.mutateAsync,
    updateTransaction: (id: number, transaction: Partial<Transaction>) => updateTransactionMutation.mutateAsync({ id, transaction }),
    deleteTransaction: deleteTransactionMutation.mutateAsync,
    addCreditCard: createCreditCardMutation.mutateAsync,
    updateCreditCard: (id: number, card: Partial<CreditCard>) => updateCreditCardMutation.mutateAsync({ id, card }),
    deleteCreditCard: deleteCreditCardMutation.mutateAsync,
    updateSettings: updateSettingsMutation.mutateAsync,
    changePassword: changePasswordMutation.mutateAsync,
    addGoal: createGoalMutation.mutateAsync,
    updateGoal: (id: number, goal: Partial<Goal>) => updateGoalMutation.mutateAsync({ id, goal }),
    deleteGoal: deleteGoalMutation.mutateAsync,
    addRecurringRule: createRecurringRuleMutation.mutateAsync,
    updateRecurringRule: (id: number, rule: Partial<RecurringRule>) => updateRecurringRuleMutation.mutateAsync({ id, rule }),
    deleteRecurringRule: deleteRecurringRuleMutation.mutateAsync,

    getTotalBalance: () => (accountsQuery.data || []).reduce((sum, acc) => sum + acc.balance, 0),
    getTotalIncome: (monthKey?: string) => {
      const txs = transactionsQuery.data || [];
      if (monthKey) {
        const projected = getProjectedTransactions(monthKey);
        const all = [...txs.filter(t => t.date.startsWith(monthKey)), ...projected];
        return all.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      }
      return txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    },
    getTotalExpenses: (monthKey?: string) => {
      const txs = transactionsQuery.data || [];
      if (monthKey) {
        const projected = getProjectedTransactions(monthKey);
        const all = [...txs.filter(t => t.date.startsWith(monthKey)), ...projected];
        return all.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      }
      return txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    },
    getCategorySpending: (categoryName: string, monthKey?: string) => {
      const txs = transactionsQuery.data || [];
      if (monthKey) {
        const projected = getProjectedTransactions(monthKey);
        const all = [...txs.filter(t => t.date.startsWith(monthKey)), ...projected];
        return all
          .filter(t => t.category === categoryName && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
      }
      return txs
        .filter(t => t.category === categoryName && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
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
