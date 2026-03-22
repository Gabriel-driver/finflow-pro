// Endpoint para listar logs no admin
app.get('/api/admin/logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (pool) {
      const result = await pool.query('SELECT id, level, message, username, created_at FROM logs ORDER BY created_at DESC LIMIT 500');
      res.json(result.rows);
    } else {
      res.json([]); // Sem logs em modo mock
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar logs', details: error.message });
  }
});
import express from 'express';
import path from 'path';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

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
  { id: 1, user_id: 1, user_name: "Duda", email: "duda@email.com", currency: "BRL", language: "pt-BR", notifications_enabled: true, alert_days_before: 3, monthly_budget: 8000, dark_mode: true, system_name: "FinFlow Pro" },
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
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

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
        addLog('WARNING', `Tentativa de login inválida para email ${email}`, 'unknown');
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      // Log login
      addLog('INFO', `Login realizado com sucesso: ${user.username} (${email})`, user.username);

      res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    } else {
      // Mock data fallback
      const user = mockUsers.find(u => u.email === email);
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        addLog('WARNING', `Tentativa de login inválida (mock) para email ${email}`, 'unknown');
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
      addLog('WARNING', `Autenticação falhou para ${req.path}: ${err.message}`, 'unknown');
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
    console.log('[AUTH] Token válido para usuário:', user);
    req.user = user;
    next();
  });
};

const getUserId = (req) => (req.user && req.user.id ? req.user.id : 1);

// PostgreSQL connection
let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  // avoid crash on unexpected idle client error
  pool.on('error', (err) => {
    console.error('[POSTGRES] idle client error, falling back to mock data:', err);
    pool = null;
  });

  pool.connect(async (err) => {
    if (err) {
      console.error('Error connecting to database:', err);
      console.log('Using mock data instead');
      pool = null; // Use mock data
      return;
    }

    console.log('Connected to database');

    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schemaSql = await fs.readFile(schemaPath, 'utf8');
      await pool.query(schemaSql);
      console.log('Database schema ensured (schema.sql applied)');

      // Optionally run an admin seed
      const existingAdmin = await pool.query('SELECT id FROM users WHERE id = 1');
      if (existingAdmin.rows.length === 0) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await pool.query(
          'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
          ['admin', 'admin@finflow.com', hashedPassword]
        );
        console.log('Admin user created (admin@finflow.com / admin123)');
      }
    } catch (schemaError) {
      console.error('Error initializing database schema:', schemaError);
      addLog('ERROR', `Erro inicializando esquema: ${schemaError.message}`, 'system');
      // fallback to mock data if cannot apply schema
      pool = null;
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

// Ensure authenticated access to user-specific APIs
const protectedApis = [
  'accounts',
  'categories',
  'transactions',
  'credit-cards',
  'goals',
  'notifications',
  'monthly-plans',
  'settings',
  'budgets',
];
protectedApis.forEach((route) => {
  app.use(`/api/${route}`, authMiddleware);
});

// Error tracking for all API outcomes
app.use('/api', (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      const level = res.statusCode >= 500 ? 'ERROR' : 'WARNING';
      addLog(level, `${req.method} ${req.path} retornou ${res.statusCode}`, req.user ? req.user.username : 'anonymous');
    }
  });
  next();
});

// Admin routes
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('[GET /api/admin/users] Processando requisição. Pool disponível:', !!pool);

    if (pool) {
      console.log('[GET /api/admin/users] Buscando usuários do banco com configurações');
      const result = await pool.query(
        `SELECT u.id, u.username, u.email, u.created_at, s.system_name
         FROM users u
         LEFT JOIN settings s ON s.user_id = u.id
         ORDER BY u.created_at DESC`
      );
      const rows = result.rows.map((row) => ({
        id: row.id,
        username: row.username,
        email: row.email,
        created_at: row.created_at,
        systemName: row.system_name || 'FinFlow Pro',
      }));
      console.log('[GET /api/admin/users] Usuários encontrados:', rows.length);
      res.json(rows);
    } else {
      console.log('[GET /api/admin/users] Pool null, usando mock data');
      res.json(mockUsers.map((u) => {
        const settings = mockSettings.find((s) => s.user_id === u.id);
        return {
          id: u.id,
          username: u.username,
          email: u.email,
          created_at: new Date().toISOString(),
          systemName: settings?.system_name || 'FinFlow Pro',
        };
      }));
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

app.put('/api/admin/users/:id/system-name', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const systemName = req.body.systemName || req.body.system_name || 'FinFlow Pro';

    if (pool) {
      const result = await pool.query(
        `INSERT INTO settings (user_id, system_name)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET system_name = EXCLUDED.system_name
         RETURNING user_id, system_name`,
        [userId, systemName]
      );
      addLog('INFO', `Admin atualizou systemName do usuário ${userId} para "${systemName}"`, req.user.username);
      return res.json({ userId: result.rows[0].user_id, systemName: result.rows[0].system_name });
    }

    const index = mockSettings.findIndex((s) => s.user_id === userId);
    if (index >= 0) {
      mockSettings[index].system_name = systemName;
      addLog('INFO', `Admin atualizou systemName do mock user ${userId} para "${systemName}"`, req.user.username);
      return res.json({ userId, systemName });
    }

    const userIndex = mockUsers.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    mockSettings.push({
      id: mockSettings.length + 1,
      user_id: userId,
      user_name: mockUsers[userIndex].username,
      email: mockUsers[userIndex].email,
      currency: 'BRL',
      language: 'pt-BR',
      notifications_enabled: true,
      alert_days_before: 3,
      monthly_budget: 8000,
      dark_mode: true,
      system_name: systemName,
    });

    addLog('INFO', `Admin criou systemName para mock user ${userId}: "${systemName}"`, req.user.username);
    res.json({ userId, systemName });
  } catch (error) {
    console.error('[ERROR] Erro ao atualizar systemName do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

app.get('/api/admin/settings/system-name', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ systemName: defaultSystemName });
});

app.put('/api/admin/settings/system-name', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const systemName = req.body.systemName || req.body.system_name;
    if (!systemName || systemName.trim().length === 0) {
      return res.status(400).json({ error: 'Nome do sistema é obrigatório' });
    }

    defaultSystemName = systemName;
    addLog('INFO', `Admin atualizou systemName global para "${systemName}"`, req.user.username);
    res.json({ systemName: defaultSystemName });
  } catch (error) {
    console.error('[ERROR] Erro ao atualizar systemName global:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

let defaultSystemName = 'FinFlow Pro';

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
    const search = (req.query.search || '').toString().trim().toLowerCase();
    const level = (req.query.level || '').toString().toUpperCase();
    const filtered = systemLogs
      .filter((log) => {
        const matchesText = !search || log.message.toLowerCase().includes(search) || log.user.toLowerCase().includes(search);
        const matchesLevel = !level || log.level === level;
        return matchesText && matchesLevel;
      });

    const result = filtered.slice(-100);
    console.log('[GET /api/admin/logs] Retornando logs, search:', search, 'level:', level, 'count:', result.length);
    res.json(result);
  } catch (error) {
    console.error('[ERROR] Erro ao buscar logs:', error);
    addLog('ERROR', `Erro ao buscar logs: ${error.message}`, req.user ? req.user.username : 'system');
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// API Routes
// Accounts
app.get('/api/accounts', async (req, res) => {
  const userId = getUserId(req);
  if (!pool) {
    const userAccounts = mockAccounts.filter(a => a.user_id === userId);
    res.json(userAccounts);
    return;
  }
  try {
    const result = await pool.query('SELECT * FROM accounts WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/accounts', async (req, res) => {
  const userId = getUserId(req);
  if (!pool) {
    const newAccount = { ...req.body, id: mockAccounts.length + 1, user_id: userId };
    mockAccounts.push(newAccount);
    res.json(newAccount);
    return;
  }
  const { name, balance, icon, color, type } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO accounts (user_id, name, balance, icon, color, type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, name, balance, icon, color, type]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/accounts/:id', async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;
  const { name, balance, icon, color, type } = req.body;
  try {
    const result = await pool.query(
      'UPDATE accounts SET name = $1, balance = $2, icon = $3, color = $4, type = $5 WHERE id = $6 AND user_id = $7 RETURNING *',
      [name, balance, icon, color, type, id, userId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/accounts/:id', async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM accounts WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }
    res.json({ message: 'Conta deletada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Categories
app.get('/api/categories', async (req, res) => {
  const userId = getUserId(req);
  if (!pool) {
    const userCategories = mockCategories.filter(c => c.user_id === userId);
    res.json(userCategories);
    return;
  }
  try {
    const result = await pool.query('SELECT * FROM categories WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  const userId = getUserId(req);
  if (!pool) {
    const newCategory = { ...req.body, id: mockCategories.length + 1, user_id: userId };
    mockCategories.push(newCategory);
    res.json(newCategory);
    return;
  }
  const { name, type, icon, budget_limit } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO categories (user_id, name, type, icon, budget_limit) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, name, type, icon, budget_limit]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Transactions
app.get('/api/transactions', async (req, res) => {
  const userId = getUserId(req);
  if (!pool) {
    const userTransactions = mockTransactions.filter(t => t.user_id === userId);
    res.json(userTransactions);
    return;
  }
  try {
    const result = await pool.query('SELECT * FROM transactions WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  const userId = getUserId(req);
  if (!pool) {
    const newTransaction = { ...req.body, id: mockTransactions.length + 1, user_id: userId };
    mockTransactions.push(newTransaction);
    res.json(newTransaction);
    return;
  }
  const { account_id, type, amount, category, description, date, installments, current_installment, parent_id, recurring, recurring_day } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO transactions (user_id, account_id, type, amount, category, description, date, installments, current_installment, parent_id, recurring, recurring_day) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
      [userId, account_id, type, amount, category, description, date, installments, current_installment, parent_id, recurring, recurring_day]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Credit Cards
app.get('/api/credit-cards', async (req, res) => {
  const userId = getUserId(req);
  if (!pool) {
    const userCards = mockCreditCards.filter(c => c.user_id === userId);
    res.json(userCards);
    return;
  }
  try {
    const result = await pool.query('SELECT * FROM credit_cards WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/credit-cards', async (req, res) => {
  const userId = getUserId(req);
  if (!pool) {
    const newCard = { ...req.body, id: mockCreditCards.length + 1, user_id: userId };
    mockCreditCards.push(newCard);
    res.json(newCard);
    return;
  }
  const { name, icon, limit, used, closing_day, due_day, color } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO credit_cards (user_id, name, icon, "limit", used, closing_day, due_day, color) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [userId, name, icon, limit, used, closing_day, due_day, color]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Goals
app.get('/api/goals', async (req, res) => {
  const userId = getUserId(req);
  if (!pool) {
    const userGoals = mockGoals.filter(g => g.user_id === userId);
    res.json(userGoals);
    return;
  }
  try {
    const result = await pool.query('SELECT * FROM goals WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/goals', async (req, res) => {
  const userId = getUserId(req);
  if (!pool) {
    const newGoal = { ...req.body, id: mockGoals.length + 1, user_id: userId };
    mockGoals.push(newGoal);
    res.json(newGoal);
    return;
  }
  const { name, target, current, deadline, color } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO goals (user_id, name, target, current, deadline, color) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, name, target, current, deadline, color]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Notifications
app.get('/api/notifications', async (req, res) => {
  const userId = getUserId(req);
  if (!pool) {
    const userNotifications = mockNotifications.filter(n => n.user_id === userId);
    res.json(userNotifications);
    return;
  }
  try {
    const result = await pool.query('SELECT * FROM notifications WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Monthly Plans
app.get('/api/monthly-plans', async (req, res) => {
  const userId = getUserId(req);
  if (!pool) {
    const userPlans = mockMonthlyPlans.filter(p => p.user_id === userId);
    res.json(userPlans);
    return;
  }
  try {
    const result = await pool.query('SELECT * FROM monthly_plans WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/monthly-plans', async (req, res) => {
  const userId = getUserId(req);
  if (!pool) {
    const newPlan = { ...req.body, id: mockMonthlyPlans.length + 1, user_id: userId };
    mockMonthlyPlans.push(newPlan);
    res.json(newPlan);
    return;
  }
  const { month, expected_income, expected_expense, notes } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO monthly_plans (user_id, month, expected_income, expected_expense, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, month, expected_income, expected_expense, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Settings
app.get('/api/settings', async (req, res) => {
  const userId = getUserId(req);
  if (!pool) {
    const userSettings = mockSettings.find(s => s.user_id === userId);
    const response = userSettings ? {
      userName: userSettings.user_name || userSettings.userName,
      email: userSettings.email,
      currency: userSettings.currency,
      language: userSettings.language,
      notificationsEnabled: userSettings.notifications_enabled || userSettings.notificationsEnabled,
      alertDaysBefore: userSettings.alert_days_before || userSettings.alertDaysBefore,
      monthlyBudget: userSettings.monthly_budget || userSettings.monthlyBudget,
      darkMode: userSettings.dark_mode || userSettings.darkMode,
      systemName: userSettings.system_name || userSettings.systemName || defaultSystemName,
    } : { systemName: defaultSystemName };
    res.json(response);
    return;
  }
  try {
    const result = await pool.query('SELECT * FROM settings WHERE user_id = $1', [userId]);
    const row = result.rows[0];
    if (!row) {
      return res.json({});
    }
    res.json({
      userName: row.user_name,
      email: row.email,
      currency: row.currency,
      language: row.language,
      notificationsEnabled: row.notifications_enabled,
      alertDaysBefore: row.alert_days_before,
      monthlyBudget: parseFloat(row.monthly_budget),
      darkMode: row.dark_mode,
      systemName: row.system_name || defaultSystemName,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', async (req, res) => {
  const userId = getUserId(req);
  if (!pool) {
    const index = mockSettings.findIndex(s => s.user_id === userId);
    const existing = index >= 0 ? mockSettings[index] : {};
    const update = {
      user_name: req.body.userName ?? req.body.user_name ?? existing.user_name,
      email: req.body.email ?? existing.email,
      currency: req.body.currency ?? existing.currency,
      language: req.body.language ?? existing.language,
      notifications_enabled: req.body.notificationsEnabled ?? req.body.notifications_enabled ?? existing.notifications_enabled,
      alert_days_before: req.body.alertDaysBefore ?? req.body.alert_days_before ?? existing.alert_days_before,
      monthly_budget: req.body.monthlyBudget ?? req.body.monthly_budget ?? existing.monthly_budget,
      dark_mode: req.body.darkMode ?? req.body.dark_mode ?? existing.dark_mode,
      system_name: req.body.systemName ?? req.body.system_name ?? existing.system_name,
    };

    if (index >= 0) {
      mockSettings[index] = { ...mockSettings[index], ...update };
      return res.json({
        userName: mockSettings[index].user_name,
        email: mockSettings[index].email,
        currency: mockSettings[index].currency,
        language: mockSettings[index].language,
        notificationsEnabled: mockSettings[index].notifications_enabled,
        alertDaysBefore: mockSettings[index].alert_days_before,
        monthlyBudget: mockSettings[index].monthly_budget,
        darkMode: mockSettings[index].dark_mode,
      });
    }

    const newSettings = {
      id: mockSettings.length + 1,
      user_id: userId,
      ...update,
    };
    mockSettings.push(newSettings);
    return res.json({
      userName: newSettings.user_name,
      email: newSettings.email,
      currency: newSettings.currency,
      language: newSettings.language,
      notificationsEnabled: newSettings.notifications_enabled,
      alertDaysBefore: newSettings.alert_days_before,
      monthlyBudget: newSettings.monthly_budget,
      darkMode: newSettings.dark_mode,
      systemName: newSettings.system_name || 'FinFlow Pro',
    });
  }

  const user_name = req.body.userName || req.body.user_name;
  const email = req.body.email;
  const currency = req.body.currency;
  const language = req.body.language;
  const notifications_enabled = req.body.notificationsEnabled ?? req.body.notifications_enabled;
  const alert_days_before = req.body.alertDaysBefore ?? req.body.alert_days_before;
  const monthly_budget = req.body.monthlyBudget ?? req.body.monthly_budget;
  const dark_mode = req.body.darkMode ?? req.body.dark_mode;
  const system_name = req.body.systemName ?? req.body.system_name ?? 'FinFlow Pro';

  try {
    const result = await pool.query(
      `INSERT INTO settings (user_id, user_name, email, currency, language, notifications_enabled, alert_days_before, monthly_budget, dark_mode, system_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (user_id) DO UPDATE SET
         user_name = EXCLUDED.user_name,
         email = EXCLUDED.email,
         currency = EXCLUDED.currency,
         language = EXCLUDED.language,
         notifications_enabled = EXCLUDED.notifications_enabled,
         alert_days_before = EXCLUDED.alert_days_before,
         monthly_budget = EXCLUDED.monthly_budget,
         dark_mode = EXCLUDED.dark_mode,
         system_name = EXCLUDED.system_name
       RETURNING *`,
      [userId, user_name, email, currency, language, notifications_enabled, alert_days_before, monthly_budget, dark_mode, system_name]
    );
    const changed = result.rows[0];
    res.json({
      userName: changed.user_name,
      email: changed.email,
      currency: changed.currency,
      language: changed.language,
      notificationsEnabled: changed.notifications_enabled,
      alertDaysBefore: changed.alert_days_before,
      monthlyBudget: parseFloat(changed.monthly_budget),
      darkMode: changed.dark_mode,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Budgets
app.get('/api/budgets', async (req, res) => {
  const userId = getUserId(req);
  if (!pool) {
    const userBudgets = mockBudgets.filter(b => b.user_id === userId);
    res.json(userBudgets);
    return;
  }
  try {
    const result = await pool.query('SELECT * FROM budgets WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/budgets', async (req, res) => {
  const userId = getUserId(req);
  if (!pool) {
    const newBudget = { ...req.body, id: mockBudgets.length + 1, user_id: userId };
    mockBudgets.push(newBudget);
    res.json(newBudget);
    return;
  }
  const { category_id, month, amount } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO budgets (user_id, category_id, month, amount) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, category_id, month, amount]
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
  const serverHost = process.env.HOST || '0.0.0.0';
  app.listen(port, serverHost, () => {
    console.log(`Server running on ${serverHost}:${port}`);
  });
}

// Export for Vercel serverless
export default app;
