export interface Account {
  id: string;
  name: string;
  balance: number;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
}

export const mockAccounts: Account[] = [
  { id: "1", name: "Nubank", balance: 12847.32, icon: "💳", color: "hsl(var(--primary))" },
  { id: "2", name: "Itaú", balance: 5420.00, icon: "🏦", color: "hsl(var(--accent))" },
  { id: "3", name: "Carteira", balance: 340.50, icon: "👛", color: "hsl(var(--success))" },
  { id: "4", name: "Inter", balance: 8915.78, icon: "🟧", color: "hsl(var(--warning))" },
];

export const mockCategories: Category[] = [
  { id: "1", name: "Salário", type: "income", icon: "💰" },
  { id: "2", name: "Freelance", type: "income", icon: "💻" },
  { id: "3", name: "Investimentos", type: "income", icon: "📈" },
  { id: "4", name: "Alimentação", type: "expense", icon: "🍔" },
  { id: "5", name: "Transporte", type: "expense", icon: "🚗" },
  { id: "6", name: "Moradia", type: "expense", icon: "🏠" },
  { id: "7", name: "Lazer", type: "expense", icon: "🎮" },
  { id: "8", name: "Saúde", type: "expense", icon: "🏥" },
  { id: "9", name: "Educação", type: "expense", icon: "📚" },
  { id: "10", name: "Assinaturas", type: "expense", icon: "📱" },
];

export const mockTransactions: Transaction[] = [
  { id: "1", accountId: "1", type: "income", amount: 8500, category: "Salário", description: "Salário mensal", date: "2026-03-20" },
  { id: "2", accountId: "1", type: "expense", amount: 1200, category: "Moradia", description: "Aluguel apartamento", date: "2026-03-15" },
  { id: "3", accountId: "2", type: "expense", amount: 342.50, category: "Alimentação", description: "Supermercado Extra", date: "2026-03-18" },
  { id: "4", accountId: "1", type: "expense", amount: 89.90, category: "Assinaturas", description: "Spotify + Netflix", date: "2026-03-17" },
  { id: "5", accountId: "3", type: "expense", amount: 45, category: "Transporte", description: "Uber - ida ao escritório", date: "2026-03-19" },
  { id: "6", accountId: "2", type: "income", amount: 2300, category: "Freelance", description: "Projeto website cliente", date: "2026-03-14" },
  { id: "7", accountId: "4", type: "income", amount: 156.78, category: "Investimentos", description: "Dividendos ITSA4", date: "2026-03-12" },
  { id: "8", accountId: "1", type: "expense", amount: 275, category: "Saúde", description: "Consulta médica", date: "2026-03-10" },
  { id: "9", accountId: "1", type: "expense", amount: 198.50, category: "Educação", description: "Curso Udemy", date: "2026-03-08" },
  { id: "10", accountId: "3", type: "expense", amount: 120, category: "Lazer", description: "Cinema + jantar", date: "2026-03-07" },
  { id: "11", accountId: "2", type: "expense", amount: 65.30, category: "Transporte", description: "Combustível", date: "2026-03-06" },
  { id: "12", accountId: "1", type: "income", amount: 500, category: "Freelance", description: "Consultoria", date: "2026-03-05" },
];

export const monthlyData = [
  { month: "Out", income: 9200, expense: 6800 },
  { month: "Nov", income: 10500, expense: 7200 },
  { month: "Dez", income: 12000, expense: 9500 },
  { month: "Jan", income: 8800, expense: 6100 },
  { month: "Fev", income: 9600, expense: 7800 },
  { month: "Mar", income: 11456, expense: 5336 },
];

export const categoryExpenses = [
  { name: "Moradia", value: 1200, fill: "hsl(var(--chart-1))" },
  { name: "Alimentação", value: 842, fill: "hsl(var(--chart-2))" },
  { name: "Transporte", value: 510, fill: "hsl(var(--chart-3))" },
  { name: "Lazer", value: 320, fill: "hsl(var(--chart-4))" },
  { name: "Outros", value: 464, fill: "hsl(var(--chart-5))" },
];

export function getTotalBalance() {
  return mockAccounts.reduce((sum, acc) => sum + acc.balance, 0);
}

export function getTotalIncome() {
  return mockTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
}

export function getTotalExpenses() {
  return mockTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
}
