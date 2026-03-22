import express from 'express';
import path from 'path';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Mock data
const mockUsers = [
  { id: 1, username: 'duda', email: 'duda@email.com', password_hash: '$2b$10$examplehash' } // senha: password
];

const mockAccounts = [
  { id: 1, user_id: 1, name: "Nubank", balance: 12847.32, icon: "💳", color: "hsl(var(--primary))", type: "checking" },
  { id: 2, user_id: 1, name: "Itaú", balance: 5420.00, icon: "🏦", color: "hsl(var(--accent))", type: "checking" },
  { id: 3, user_id: 1, name: "Carteira", balance: 340.50, icon: "👛", color: "hsl(var(--success))", type: "wallet" },
  { id: 4, user_id: 1, name: "Inter", balance: 8915.78, icon: "🟧", color: "hsl(var(--warning))", type: "savings" },
];

const mockCategories = [
  { id: 1, user_id: 1, name: "Salário", type: "income", icon: "💰" },
  { id: 2, user_id: 1, name: "Freelance", type: "income", icon: "💻" },
  { id: 3, user_id: 1, name: "Investimentos", type: "income", icon: "📈" },
  { id: 4, user_id: 1, name: "Alimentação", type: "expense", icon: "🍔", budget_limit: 1500 },
  { id: 5, user_id: 1, name: "Transporte", type: "expense", icon: "🚗", budget_limit: 800 },
  { id: 6, user_id: 1, name: "Moradia", type: "expense", icon: "🏠", budget_limit: 2000 },
];

const mockTransactions = [
  { id: 1, user_id: 1, account_id: 1, type: "income", amount: 8500, category: "Salário", description: "Salário mensal", date: "2026-03-20" },
  { id: 2, user_id: 1, account_id: 1, type: "expense", amount: 1200, category: "Moradia", description: "Aluguel apartamento", date: "2026-03-15" },
];

const mockCreditCards = [
  { id: 1, user_id: 1, name: "Nubank Platinum", icon: "💳", limit: 15000, used: 3420.50, closing_day: 25, due_day: 5, color: "hsl(280 80% 50%)" },
];

const mockGoals = [
  { id: 1, user_id: 1, name: "Fundo de Emergência", target: 30000, current: 18600, deadline: "2026-12-31", color: "hsl(var(--primary))" },
];

const mockNotifications = [
  { id: 1, user_id: 1, title: "Alerta de Orçamento", message: "Você ultrapassou o orçamento de Alimentação", type: "warning", date: "2026-03-20T10:00:00Z", read: false },
];

const mockMonthlyPlans = [
  { id: 1, user_id: 1, month: "2026-03", expected_income: 10000, expected_expense: 7000, notes: "Plano mensal" },
];

const mockSettings = [
  { id: 1, user_id: 1, user_name: "Duda", email: "duda@email.com", currency: "BRL", language: "pt-BR", notifications_enabled: true, alert_days_before: 3, monthly_budget: 8000, dark_mode: true },
];

const mockBudgets = [
  { id: 1, user_id: 1, category_id: 4, month: "2026-03", amount: 1500 },
];

// Auth routes
app.post('/api/register', async (req, res) => {
  console.log('[API] /api/register', { body: req.body });
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    if (pool) {
      // Check if user already exists
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Usuário ou email já existe' });
      }

      // Insert new user
      const result = await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
        [username, email, hashedPassword]
      );

      const user = result.rows[0];
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);

      // Log user creation
      addLog('INFO', `Novo usuário criado: ${username} (${email})`, 'admin');

      res.json({ token, user });
    } else {
      // Mock data fallback
      const newUser = { id: mockUsers.length + 1, username, email, password_hash: hashedPassword };
      mockUsers.push(newUser);
      const token = jwt.sign({ id: newUser.id, username }, JWT_SECRET);
      res.json({ token, user: { id: newUser.id, username, email } });
    }
  } catch (error) {
    console.error('[ERROR] Erro ao registrar usuário:', error);
    addLog('ERROR', `Erro ao registrar usuário: ${error.message}`, 'system');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/login', async (req, res) => {
  console.log('[API] /api/login', { body: req.body });
  try {
    const { email, password } = req.body;

    if (pool) {
      const result = await pool.query('SELECT id, username, email, password_hash FROM users WHERE email = $1', [email]);
      const user = result.rows[0];

      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);

      // Log login
      addLog('INFO', `Login realizado: ${user.username} (${email})`, user.username);

      res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    } else {
      // Mock data fallback
      const user = mockUsers.find(u => u.email === email);
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
      res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    }
  } catch (error) {
    console.error('[ERROR] Erro ao fazer login:', error);
    addLog('ERROR', `Erro ao fazer login: ${error.message}`, 'system');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Protected routes
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    console.log('[AUTH] No token provided');
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('[AUTH] Invalid token:', err.message);
      return res.status(403).json({ error: 'Token inválido' });
    }
    console.log('[AUTH] Token válido para usuário:', user);
    req.user = user;
    next();
  });
};

// PostgreSQL connection
let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  pool.connect((err) => {
    if (err) {
      console.error('Error connecting to database:', err);
      console.log('Using mock data instead');
      pool = null; // Use mock data
    } else {
      console.log('Connected to database');
    }
  });
} catch (e) {
  console.log('No database configured, using mock data');
  pool = null;
}

// Admin middleware - check if user is admin (for now, user id 1 is admin)
const adminMiddleware = (req, res, next) => {
  console.log('[ADMIN] Verificando acesso admin. User:', req.user);
  if (!req.user) {
    console.log('[ADMIN] Sem user no request');
    return res.status(403).json({ error: 'Usuário não autenticado' });
  }
  if (req.user.id !== 1) {
    console.log('[ADMIN] Usuário não é admin. ID:', req.user.id);
    return res.status(403).json({ error: 'Acesso negado - apenas admin' });
  }
  console.log('[ADMIN] Acesso permitido para admin');
  next();
};

// Admin routes
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('[GET /api/admin/users] Processando requisição. Pool disponível:', !!pool);
    
    if (pool) {
      console.log('[GET /api/admin/users] Buscando usuários do banco');
      const result = await pool.query('SELECT id, username, email, created_at FROM users ORDER BY created_at DESC');
      console.log('[GET /api/admin/users] Usuários encontrados:', result.rows.length);
      res.json(result.rows);
    } else {
      console.log('[GET /api/admin/users] Pool null, usando mock data');
      res.json(mockUsers.map(u => ({ id: u.id, username: u.username, email: u.email, created_at: new Date().toISOString() })));
    }
  } catch (error) {
    console.error('[ERROR] Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

app.post('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('[POST /api/admin/users] Criando novo usuário:', req.body.username, req.body.email);
    
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email e password são obrigatórios' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);

    if (pool) {
      console.log('[POST /api/admin/users] Verificando se usuário já existe');
      // Check if user already exists
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Usuário ou email já existe' });
      }

      console.log('[POST /api/admin/users] Inserindo novo usuário no banco');
      // Insert new user
      const result = await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
        [username, email, hashedPassword]
      );

      const user = result.rows[0];
      console.log('[POST /api/admin/users] Usuário criado com sucesso:', user.id);
      addLog('INFO', `Usuário criado pelo admin: ${username} (${email})`, req.user.username);
      res.json(user);
    } else {
      console.log('[POST /api/admin/users] Pool null, usando mock data');
      const newUser = { id: mockUsers.length + 1, username, email, password_hash: hashedPassword, created_at: new Date().toISOString() };
      mockUsers.push(newUser);
      res.json({ id: newUser.id, username: newUser.username, email: newUser.email, created_at: newUser.created_at });
    }
  } catch (error) {
    console.error('[ERROR] Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    console.log('[DELETE /api/admin/users/:id] Deletando usuário ID:', userId);

    if (pool) {
      const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      addLog('WARNING', `Usuário deletado pelo admin: ID ${userId}`, req.user.username);
      res.json({ message: 'Usuário deletado com sucesso' });
    } else {
      const index = mockUsers.findIndex(u => u.id === userId);
      if (index === -1) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      mockUsers.splice(index, 1);
      res.json({ message: 'Usuário deletado com sucesso' });
    }
  } catch (error) {
    console.error('[ERROR] Erro ao deletar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Logs route (simple in-memory logs for now)
let systemLogs = [
  { id: 1, timestamp: new Date().toISOString(), level: 'INFO', message: 'Sistema iniciado', user: 'system' },
];

function addLog(level, message, user = 'system') {
  const logEntry = {
    id: systemLogs.length + 1,
    timestamp: new Date().toISOString(),
    level,
    message,
    user
  };
  systemLogs.push(logEntry);
  console.log(`[${level}] ${message} - ${user}`);
}

app.get('/api/admin/logs', authMiddleware, adminMiddleware, (req, res) => {
  try {
    console.log('[GET /api/admin/logs] Retornando últimos 100 logs');
    res.json(systemLogs.slice(-100)); // Last 100 logs
  } catch (error) {
    console.error('[ERROR] Erro ao buscar logs:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// API Routes
// Accounts
app.get('/api/accounts', async (req, res) => {
  if (!pool) {
    const userAccounts = mockAccounts.filter(a => a.user_id === 1); // mock user
    res.json(userAccounts);
    return;
  }
  try {
    const result = await pool.query('SELECT * FROM accounts WHERE user_id = $1', [1]); // mock user
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/accounts', async (req, res) => {
  if (!pool) {
    const newAccount = { ...req.body, id: mockAccounts.length + 1, user_id: 1 };
    mockAccounts.push(newAccount);
    res.json(newAccount);
    return;
  }
  const { name, balance, icon, color, type } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO accounts (user_id, name, balance, icon, color, type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [1, name, balance, icon, color, type]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/accounts/:id', async (req, res) => {
  const { id } = req.params;
  const { name, balance, icon, color, type } = req.body;
  try {
    const result = await pool.query(
      'UPDATE accounts SET name = $1, balance = $2, icon = $3, color = $4, type = $5 WHERE id = $6 RETURNING *',
      [name, balance, icon, color, type, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/accounts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM accounts WHERE id = $1', [id]);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Categories
app.get('/api/categories', async (req, res) => {
  if (!pool) {
    const userCategories = mockCategories.filter(c => c.user_id === 1);
    res.json(userCategories);
    return;
  }
  try {
    const result = await pool.query('SELECT * FROM categories WHERE user_id = $1', [1]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  if (!pool) {
    const newCategory = { ...req.body, id: mockCategories.length + 1, user_id: 1 };
    mockCategories.push(newCategory);
    res.json(newCategory);
    return;
  }
  const { name, type, icon, budget_limit } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO categories (user_id, name, type, icon, budget_limit) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [1, name, type, icon, budget_limit]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Transactions
app.get('/api/transactions', async (req, res) => {
  if (!pool) {
    const userTransactions = mockTransactions.filter(t => t.user_id === 1);
    res.json(userTransactions);
    return;
  }
  try {
    const result = await pool.query('SELECT * FROM transactions WHERE user_id = $1', [1]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  if (!pool) {
    const newTransaction = { ...req.body, id: mockTransactions.length + 1, user_id: 1 };
    mockTransactions.push(newTransaction);
    res.json(newTransaction);
    return;
  }
  const { account_id, type, amount, category, description, date, installments, current_installment, parent_id, recurring, recurring_day } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO transactions (user_id, account_id, type, amount, category, description, date, installments, current_installment, parent_id, recurring, recurring_day) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
      [1, account_id, type, amount, category, description, date, installments, current_installment, parent_id, recurring, recurring_day]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Credit Cards
app.get('/api/credit-cards', async (req, res) => {
  if (!pool) {
    const userCards = mockCreditCards.filter(c => c.user_id === 1);
    res.json(userCards);
    return;
  }
  try {
    const result = await pool.query('SELECT * FROM credit_cards WHERE user_id = $1', [1]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/credit-cards', async (req, res) => {
  if (!pool) {
    const newCard = { ...req.body, id: mockCreditCards.length + 1, user_id: 1 };
    mockCreditCards.push(newCard);
    res.json(newCard);
    return;
  }
  const { name, icon, limit, used, closing_day, due_day, color } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO credit_cards (user_id, name, icon, "limit", used, closing_day, due_day, color) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [1, name, icon, limit, used, closing_day, due_day, color]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Goals
app.get('/api/goals', async (req, res) => {
  if (!pool) {
    const userGoals = mockGoals.filter(g => g.user_id === 1);
    res.json(userGoals);
    return;
  }
  try {
    const result = await pool.query('SELECT * FROM goals WHERE user_id = $1', [1]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/goals', async (req, res) => {
  if (!pool) {
    const newGoal = { ...req.body, id: mockGoals.length + 1, user_id: 1 };
    mockGoals.push(newGoal);
    res.json(newGoal);
    return;
  }
  const { name, target, current, deadline, color } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO goals (user_id, name, target, current, deadline, color) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [1, name, target, current, deadline, color]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Notifications
app.get('/api/notifications', async (req, res) => {
  if (!pool) {
    const userNotifications = mockNotifications.filter(n => n.user_id === 1);
    res.json(userNotifications);
    return;
  }
  try {
    const result = await pool.query('SELECT * FROM notifications WHERE user_id = $1', [1]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Monthly Plans
app.get('/api/monthly-plans', async (req, res) => {
  if (!pool) {
    const userPlans = mockMonthlyPlans.filter(p => p.user_id === 1);
    res.json(userPlans);
    return;
  }
  try {
    const result = await pool.query('SELECT * FROM monthly_plans WHERE user_id = $1', [1]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/monthly-plans', async (req, res) => {
  if (!pool) {
    const newPlan = { ...req.body, id: mockMonthlyPlans.length + 1, user_id: 1 };
    mockMonthlyPlans.push(newPlan);
    res.json(newPlan);
    return;
  }
  const { month, expected_income, expected_expense, notes } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO monthly_plans (user_id, month, expected_income, expected_expense, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [1, month, expected_income, expected_expense, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Settings
app.get('/api/settings', async (req, res) => {
  if (!pool) {
    const userSettings = mockSettings.find(s => s.user_id === 1);
    res.json(userSettings || {});
    return;
  }
  try {
    const result = await pool.query('SELECT * FROM settings WHERE user_id = $1', [1]);
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', async (req, res) => {
  if (!pool) {
    const index = mockSettings.findIndex(s => s.user_id === 1);
    if (index >= 0) {
      mockSettings[index] = { ...mockSettings[index], ...req.body };
      res.json(mockSettings[index]);
    } else {
      const newSettings = { ...req.body, id: mockSettings.length + 1, user_id: 1 };
      mockSettings.push(newSettings);
      res.json(newSettings);
    }
    return;
  }
  const { user_name, email, currency, language, notifications_enabled, alert_days_before, monthly_budget, dark_mode } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO settings (user_id, user_name, email, currency, language, notifications_enabled, alert_days_before, monthly_budget, dark_mode)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id) DO UPDATE SET
         user_name = EXCLUDED.user_name,
         email = EXCLUDED.email,
         currency = EXCLUDED.currency,
         language = EXCLUDED.language,
         notifications_enabled = EXCLUDED.notifications_enabled,
         alert_days_before = EXCLUDED.alert_days_before,
         monthly_budget = EXCLUDED.monthly_budget,
         dark_mode = EXCLUDED.dark_mode
       RETURNING *`,
      [1, user_name, email, currency, language, notifications_enabled, alert_days_before, monthly_budget, dark_mode]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Budgets
app.get('/api/budgets', async (req, res) => {
  if (!pool) {
    const userBudgets = mockBudgets.filter(b => b.user_id === 1);
    res.json(userBudgets);
    return;
  }
  try {
    const result = await pool.query('SELECT * FROM budgets WHERE user_id = $1', [1]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/budgets', async (req, res) => {
  if (!pool) {
    const newBudget = { ...req.body, id: mockBudgets.length + 1, user_id: 1 };
    mockBudgets.push(newBudget);
    res.json(newBudget);
    return;
  }
  const { category_id, month, amount } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO budgets (user_id, category_id, month, amount) VALUES ($1, $2, $3, $4) RETURNING *',
      [1, category_id, month, amount]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1d',
  etag: false,
  setHeaders: (res, filePath) => {
    // Set proper MIME types
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Catch all handler: send back React's index.html file ONLY for SPA routes
app.use((req, res) => {
  // Don't serve index.html for API calls or files with extensions
  if (req.path.startsWith('/api/') || req.path.includes('.')) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  console.log('Serving index.html for SPA route:', req.path);
  res.sendFile(path.join(__dirname, 'dist/index.html'), (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Only listen in development/local environment
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

// Export for Vercel serverless
export default app;
