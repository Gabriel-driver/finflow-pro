// IMPORTS NO TOPO
// (Removido bloco duplicado de imports)
// (Removido bloco duplicado de imports e inicialização)
// (Movido: definição de rotas deve vir após a declaração do app)
// (Removido bloco duplicado de imports)

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { promises as fs } from 'fs';
import multer from 'multer';
import ExcelJS from 'exceljs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

// Multer config for file uploads
const upload = multer({ storage: multer.memoryStorage() });

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

      // Migration: Ensure all columns exist in transactions
      await pool.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='credit_card_id') THEN
            ALTER TABLE transactions ADD COLUMN credit_card_id INTEGER REFERENCES credit_cards(id);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='installments') THEN
            ALTER TABLE transactions ADD COLUMN installments INTEGER;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='current_installment') THEN
            ALTER TABLE transactions ADD COLUMN current_installment INTEGER;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='parent_id') THEN
            ALTER TABLE transactions ADD COLUMN parent_id INTEGER REFERENCES transactions(id);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='recurring') THEN
            ALTER TABLE transactions ADD COLUMN recurring BOOLEAN DEFAULT FALSE;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='recurring_day') THEN
            ALTER TABLE transactions ADD COLUMN recurring_day INTEGER;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='goals' AND column_name='icon') THEN
            ALTER TABLE goals ADD COLUMN icon VARCHAR(10);
          END IF;
        END $$;
      `);
      console.log('Database migrations completed (columns checked)');

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
      
      // Process recurring rules on startup after database is ready
      processRecurringRules();
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
  'import',
  'settings/change-password',
  'recurring-rules',
];
protectedApis.forEach((route) => {
  app.use(`/api/${route}`, authMiddleware);
});

// Background processor for recurring transactions
async function processRecurringRules() {
  if (!pool) return;
  
  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  console.log(`[RECURRING] Processing rules for month: ${currentMonth}`);
  
  try {
    const rulesRes = await pool.query(
      `SELECT * FROM recurring_rules 
       WHERE active = TRUE 
       AND (last_processed_month IS NULL OR last_processed_month < $1)
       AND (start_date <= CURRENT_DATE)
       AND (end_date IS NULL OR end_date >= CURRENT_DATE)`,
      [currentMonth]
    );
    
    const rules = rulesRes.rows;
    console.log(`[RECURRING] Found ${rules.length} rules to process`);
    
    for (const rule of rules) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const transactionDate = new Date();
        transactionDate.setDate(rule.recurring_day);
        const dateStr = transactionDate.toISOString().split('T')[0];
        
        // Insert transaction
        await client.query(
          `INSERT INTO transactions 
           (user_id, account_id, credit_card_id, type, amount, category, description, date, recurring, recurring_day)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, $9)`,
          [rule.user_id, rule.account_id, rule.credit_card_id, rule.type, rule.amount, rule.category, `${rule.description} (Recorrente)`, dateStr, rule.recurring_day]
        );
        
        // Update balance
        if (rule.account_id) {
          const balanceChange = rule.type === 'income' ? rule.amount : -rule.amount;
          await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [balanceChange, rule.account_id]);
        } else if (rule.credit_card_id) {
          await client.query('UPDATE credit_cards SET used = used + $1 WHERE id = $2', [rule.amount, rule.credit_card_id]);
        }
        
        // Update rule
        await client.query(
          'UPDATE recurring_rules SET last_processed_month = $1 WHERE id = $2',
          [currentMonth, rule.id]
        );

        // Add notification
        await client.query(
          'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
          [rule.user_id, 'Conta Recorrente Processada', `A conta "${rule.description}" de R$ ${rule.amount.toFixed(2)} foi lançada automaticamente.`, 'success']
        );
        
        await client.query('COMMIT');
        console.log(`[RECURRING] Processed rule: ${rule.description} for user ${rule.user_id}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[RECURRING] Error processing rule ${rule.id}:`, err);
      } finally {
        client.release();
      }
    }
    
    // Check for upcoming due dates (notifications)
    await checkUpcomingDueDates();
    
  } catch (err) {
    console.error('[RECURRING] Error fetching rules:', err);
  }
}

async function checkUpcomingDueDates() {
  if (!pool) return;
  
  try {
    // 1. Check Credit Card due dates
    const cards = await pool.query('SELECT * FROM credit_cards');
    for (const card of cards.rows) {
      const today = new Date();
      const dueDay = card.due_day;
      const currentDay = today.getDate();
      
      if (dueDay - currentDay <= 3 && dueDay - currentDay > 0) {
        // Only notify if not notified in the last 24h
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type)
           SELECT $1, $2, $3, $4
           WHERE NOT EXISTS (
             SELECT 1 FROM notifications 
             WHERE user_id = $1 AND title = $2 AND date > NOW() - INTERVAL '24 hours'
           )`,
          [card.user_id, 'Vencimento de Fatura', `A fatura do cartão "${card.name}" vence em ${dueDay - currentDay} dias.`, 'warning']
        );
      }
    }

    // 2. Check Budget limits
    const settings = await pool.query('SELECT * FROM settings');
    for (const set of settings.rows) {
      if (set.monthly_budget > 0) {
        const monthKey = new Date().toISOString().slice(0, 7);
        const expensesRes = await pool.query(
          "SELECT SUM(amount) as total FROM transactions WHERE user_id = $1 AND type = 'expense' AND date::text LIKE $2",
          [set.user_id, `${monthKey}%`]
        );
        const totalExpenses = parseFloat(expensesRes.rows[0].total || 0);
        
        if (totalExpenses > set.monthly_budget * 0.8) {
          await pool.query(
            `INSERT INTO notifications (user_id, title, message, type)
             SELECT $1, $2, $3, $4
             WHERE NOT EXISTS (
               SELECT 1 FROM notifications 
               WHERE user_id = $1 AND title = $2 AND date > NOW() - INTERVAL '7 days'
             )`,
            [set.user_id, 'Alerta de Orçamento', `Você já utilizou mais de 80% do seu orçamento mensal (R$ ${totalExpenses.toFixed(2)} de R$ ${set.monthly_budget.toFixed(2)}).`, 'danger']
          );
        }
      }
    }
  } catch (err) {
    console.error('[NOTIFICATIONS] Error checking due dates:', err);
  }
}

// Recurring Rules API
app.get('/api/recurring-rules', async (req, res) => {
  const userId = getUserId(req);
  if (!pool) return res.json([]);
  try {
    const result = await pool.query('SELECT * FROM recurring_rules WHERE user_id = $1 ORDER BY recurring_day', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/recurring-rules', async (req, res) => {
  const userId = getUserId(req);
  const { account_id, credit_card_id, type, amount, category, description, recurring_day, end_date } = req.body;
  
  if (!pool) return res.status(400).json({ error: 'Database not available' });
  
  try {
    const result = await pool.query(
      `INSERT INTO recurring_rules 
       (user_id, account_id, credit_card_id, type, amount, category, description, recurring_day, end_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [userId, account_id, credit_card_id, type, amount, category, description, recurring_day, end_date]
    );
    
    // Process rule immediately for the current month if applicable
    await processRecurringRules();
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/recurring-rules/:id', async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;
  const { account_id, credit_card_id, type, amount, category, description, recurring_day, active, end_date } = req.body;
  
  if (!pool) return res.status(400).json({ error: 'Database not available' });
  
  try {
    const result = await pool.query(
      `UPDATE recurring_rules 
       SET account_id = $1, credit_card_id = $2, type = $3, amount = $4, category = $5, 
           description = $6, recurring_day = $7, active = $8, end_date = $9 
       WHERE id = $10 AND user_id = $11 RETURNING *`,
      [account_id, credit_card_id, type, amount, category, description, recurring_day, active, end_date, id, userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/recurring-rules/:id', async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;
  if (!pool) return res.status(400).json({ error: 'Database not available' });
  try {
    await pool.query('DELETE FROM recurring_rules WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ message: 'Regra deletada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
  const { accountId, account_id, creditCardId, credit_card_id, type, amount, category, description, date, installments, currentInstallment, current_installment, parentId, parent_id, recurring, recurringDay, recurring_day } = req.body;
  
  const final_account_id = accountId || account_id ? parseInt(accountId || account_id) : null;
  const final_credit_card_id = creditCardId || credit_card_id ? parseInt(creditCardId || credit_card_id) : null;
  const final_current_installment = currentInstallment || current_installment || 1;
  const final_parent_id = (parentId || parent_id) ? parseInt(parentId || parent_id) : null;
  const final_recurring = (recurring === true || recurring === 'true');
  const final_recurring_day = recurringDay || recurring_day || 0;
  const final_amount = parseFloat(amount);

  console.log('[POST /api/transactions] Recebido:', { userId, final_account_id, final_credit_card_id, type, final_amount, description, final_recurring });

  if (!pool) {
    const newTransaction = { 
      ...req.body, 
      account_id: final_account_id,
      credit_card_id: final_credit_card_id,
      current_installment: final_current_installment,
      parent_id: final_parent_id,
      recurring: final_recurring,
      recurring_day: final_recurring_day,
      id: mockTransactions.length + 1, 
      user_id: userId 
    };
    mockTransactions.push(newTransaction);
    
    // Update balance in mock data
    if (final_account_id) {
      const account = mockAccounts.find(a => a.id === final_account_id);
      if (account) {
        if (type === 'income') account.balance += final_amount;
        else account.balance -= final_amount;
      }
    } else if (final_credit_card_id) {
      const card = mockCreditCards.find(c => c.id === final_credit_card_id);
      if (card) {
        card.used += final_amount;
      }
    }
    
    res.json(newTransaction);
    return;
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const numInstallments = installments ? parseInt(installments) : 1;
    const results = [];
    let currentParentId = null;

    for (let i = 0; i < numInstallments; i++) {
      const current_installment = i + 1;
      const transactionDate = new Date(date);
      if (isNaN(transactionDate.getTime())) {
        throw new Error('Data inválida fornecida');
      }
      transactionDate.setMonth(transactionDate.getMonth() + i);
      const dateStr = transactionDate.toISOString().split('T')[0];
      
      const installmentDescription = numInstallments > 1 
        ? `${description} (${current_installment}/${numInstallments})`
        : description;

      const result = await client.query(
        'INSERT INTO transactions (user_id, account_id, credit_card_id, type, amount, category, description, date, installments, current_installment, parent_id, recurring, recurring_day) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
        [userId, final_account_id, final_credit_card_id, type, final_amount, category, installmentDescription, dateStr, numInstallments, current_installment, currentParentId, final_recurring, final_recurring_day]
      );
      
      const newTx = result.rows[0];
      results.push(newTx);
      
      if (i === 0) {
        currentParentId = newTx.id;
        // Update the first one to set itself as parent if it has installments
        if (numInstallments > 1) {
          await client.query('UPDATE transactions SET parent_id = $1 WHERE id = $1', [newTx.id]);
          newTx.parent_id = newTx.id;
        }

        // Only update balance for the FIRST installment (or if it's not a credit card)
        const today = new Date().toISOString().split('T')[0];
        if (dateStr <= today) {
          if (final_account_id) {
            const balanceChange = type === 'income' ? final_amount : -final_amount;
            await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2 AND user_id = $3', [balanceChange, final_account_id, userId]);
          } else if (final_credit_card_id) {
            await client.query('UPDATE credit_cards SET used = used + $1 WHERE id = $2 AND user_id = $3', [final_amount, final_credit_card_id, userId]);
          }
        }
      } else {
        // Update parent_id for subsequent installments
        await client.query('UPDATE transactions SET parent_id = $1 WHERE id = $2', [currentParentId, newTx.id]);
      }
    }
    
    await client.query('COMMIT');
    res.json(results[0]);
  } catch (err) {
    console.error('[ERROR] Erro ao processar transação:', err);
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.put('/api/transactions/:id', async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;
  const { accountId, account_id, creditCardId, credit_card_id, type, amount, category, description, date } = req.body;
  const final_account_id = accountId || account_id ? parseInt(accountId || account_id) : null;
  const final_credit_card_id = creditCardId || credit_card_id ? parseInt(creditCardId || credit_card_id) : null;

  if (!pool) {
    const index = mockTransactions.findIndex(t => t.id === parseInt(id) && t.user_id === userId);
    if (index === -1) return res.status(404).json({ error: 'Transação não encontrada' });
    
    const oldTx = mockTransactions[index];
    const today = new Date().toISOString().split('T')[0];
    const oldTxDate = new Date(oldTx.date).toISOString().split('T')[0];
    const oldAmount = parseFloat(oldTx.amount);

    // Revert old balance if it was in the past/today
    if (oldTxDate <= today) {
      if (oldTx.account_id) {
        const oldAccount = mockAccounts.find(a => a.id === oldTx.account_id);
        if (oldAccount) {
          if (oldTx.type === 'income') oldAccount.balance -= oldAmount;
          else oldAccount.balance += oldAmount;
        }
      } else if (oldTx.credit_card_id) {
        const oldCard = mockCreditCards.find(c => c.id === oldTx.credit_card_id);
        if (oldCard) oldCard.used -= oldAmount;
      }
    }
    
    // Apply new balance if new date is in the past/today
    const newAmount = parseFloat(amount);
    const newTxDate = new Date(date).toISOString().split('T')[0];
    if (newTxDate <= today) {
      if (final_account_id) {
        const newAccount = mockAccounts.find(a => a.id === final_account_id);
        if (newAccount) {
          if (type === 'income') newAccount.balance += newAmount;
          else newAccount.balance -= newAmount;
        }
      } else if (final_credit_card_id) {
        const newCard = mockCreditCards.find(c => c.id === final_credit_card_id);
        if (newCard) newCard.used += newAmount;
      }
    }

    mockTransactions[index] = { ...oldTx, ...req.body, id: parseInt(id), user_id: userId, account_id: final_account_id, credit_card_id: final_credit_card_id, amount: newAmount };
    return res.json(mockTransactions[index]);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const oldTxRes = await client.query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
    if (oldTxRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Transação não encontrada' });
    }
    const oldTx = oldTxRes.rows[0];
    const today = new Date().toISOString().split('T')[0];
    const oldTxDate = new Date(oldTx.date).toISOString().split('T')[0];
    const oldAmount = parseFloat(oldTx.amount);

    // Revert old balance if it was in the past/today
    if (oldTxDate <= today) {
      if (oldTx.account_id) {
        const balanceChange = oldTx.type === 'income' ? -oldAmount : oldAmount;
        await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2 AND user_id = $3', [balanceChange, oldTx.account_id, userId]);
      } else if (oldTx.credit_card_id) {
        await client.query('UPDATE credit_cards SET used = used - $1 WHERE id = $2 AND user_id = $3', [oldAmount, oldTx.credit_card_id, userId]);
      }
    }

    // Update transaction
    const finalAmount = parseFloat(amount);
    const result = await client.query(
      'UPDATE transactions SET account_id = $1, credit_card_id = $2, type = $3, amount = $4, category = $5, description = $6, date = $7 WHERE id = $8 AND user_id = $9 RETURNING *',
      [final_account_id, final_credit_card_id, type, finalAmount, category, description, date, id, userId]
    );

    // Apply new balance if new date is in the past/today
    const newTxDate = new Date(date).toISOString().split('T')[0];
    if (newTxDate <= today) {
      if (final_account_id) {
        const balanceChange = type === 'income' ? finalAmount : -finalAmount;
        await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2 AND user_id = $3', [balanceChange, final_account_id, userId]);
      } else if (final_credit_card_id) {
        await client.query('UPDATE credit_cards SET used = used + $1 WHERE id = $2 AND user_id = $3', [finalAmount, final_credit_card_id, userId]);
      }
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;
  const transactionId = parseInt(id);

  if (!pool) {
    const index = mockTransactions.findIndex(t => t.id === transactionId && t.user_id === userId);
    if (index === -1) return res.status(404).json({ error: 'Transação não encontrada' });
    
    const tx = mockTransactions[index];
    const today = new Date().toISOString().split('T')[0];
    const txDate = new Date(tx.date).toISOString().split('T')[0];
    const txAmount = parseFloat(tx.amount);

    // Reverter saldo se a transação for no passado ou hoje
    if (txDate <= today) {
      if (tx.account_id) {
        const account = mockAccounts.find(a => a.id === tx.account_id);
        if (account) {
          if (tx.type === 'income') account.balance -= txAmount;
          else account.balance += txAmount;
        }
      } else if (tx.credit_card_id) {
        const card = mockCreditCards.find(c => c.id === tx.credit_card_id);
        if (card) {
          card.used -= txAmount;
        }
      }
    }
    
    mockTransactions.splice(index, 1);
    return res.json({ message: 'Deletado com sucesso' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Buscar a transação antes de deletar para saber o que reverter
    const txRes = await client.query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [transactionId, userId]);
    if (txRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Transação não encontrada' });
    }
    
    const tx = txRes.rows[0];
    
    // Comparação de data segura: extrair apenas YYYY-MM-DD ignorando timezone
    const txDateStr = tx.date instanceof Date 
      ? tx.date.toISOString().split('T')[0] 
      : String(tx.date).split('T')[0];
    
    const todayStr = new Date().toISOString().split('T')[0];
    const txAmount = parseFloat(tx.amount || 0);

    console.log(`[DELETE] Revertendo: ${tx.description}, Data: ${txDateStr}, Hoje: ${todayStr}, Valor: ${txAmount}`);

    // Reverter saldo/limite se a data for hoje ou no passado
    if (txDateStr <= todayStr) {
      if (tx.account_id) {
        const balanceChange = tx.type === 'income' ? -txAmount : txAmount;
        await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2 AND user_id = $3', [balanceChange, tx.account_id, userId]);
      } else if (tx.credit_card_id) {
        await client.query('UPDATE credit_cards SET used = used - $1 WHERE id = $2 AND user_id = $3', [txAmount, tx.credit_card_id, userId]);
      }
    }

    // 1. Limpar referências de parent_id em toda a tabela para este ID
    // Isso "orfana" as parcelas seguintes para que possamos apagar a primeira sem erro de Foreign Key.
    const updateRes = await client.query(
      'UPDATE transactions SET parent_id = NULL WHERE parent_id = $1', 
      [transactionId]
    );
    if (updateRes.rowCount > 0) {
      console.log(`[DELETE] ${updateRes.rowCount} transações filhas foram desconectadas do pai ${transactionId}`);
    }

    // 2. Deletar a transação propriamente dita
    const deleteRes = await client.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id', 
      [transactionId, userId]
    );
    
    await client.query('COMMIT');
    console.log(`[DELETE] Sucesso: ID ${transactionId}`);
    res.json({ message: 'Deletada com sucesso' });
  } catch (err) {
    console.error('[ERROR DELETE /api/transactions/:id]:', err.message);
    await client.query('ROLLBACK');
    res.status(500).json({ 
      error: 'Erro interno ao deletar transação',
      message: err.message,
      detail: err.detail
    });
  } finally {
    client.release();
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
  const { name, icon, limit, used, closingDay, dueDay, color } = req.body;
  
  console.log('[POST /api/credit-cards] Recebido:', { userId, name, limit, closingDay, dueDay });

  if (!pool) {
    const newCard = { 
      name, icon, limit, used, 
      closing_day: closingDay, 
      due_day: dueDay, 
      color, 
      id: mockCreditCards.length + 1, 
      user_id: userId 
    };
    mockCreditCards.push(newCard);
    res.json(newCard);
    return;
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO credit_cards (user_id, name, icon, "limit", used, closing_day, due_day, color) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [userId, name, icon, parseFloat(limit) || 0, parseFloat(used) || 0, parseInt(closingDay) || 1, parseInt(dueDay) || 1, color]
    );
    console.log('[POST /api/credit-cards] Sucesso:', result.rows[0].id);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[ERROR SQL /api/credit-cards]:', err.message);
    console.error('[ERROR DETAIL]:', err.detail);
    res.status(500).json({ error: `Erro no banco de dados: ${err.message}` });
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

app.put('/api/credit-cards/:id', async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;
  const { name, icon, limit, used, closingDay, dueDay, color } = req.body;

  if (!pool) {
    const index = mockCreditCards.findIndex(c => c.id === parseInt(id) && c.user_id === userId);
    if (index === -1) return res.status(404).json({ error: 'Cartão não encontrado' });
    mockCreditCards[index] = { ...mockCreditCards[index], ...req.body, id: parseInt(id) };
    return res.json(mockCreditCards[index]);
  }

  try {
    const result = await pool.query(
      'UPDATE credit_cards SET name = $1, icon = $2, "limit" = $3, used = $4, closing_day = $5, due_day = $6, color = $7 WHERE id = $8 AND user_id = $9 RETURNING *',
      [name, icon, parseFloat(limit) || 0, parseFloat(used) || 0, parseInt(closingDay) || 1, parseInt(dueDay) || 1, color, id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[ERROR SQL /api/credit-cards/:id]:', err.message);
    res.status(500).json({ error: `Erro no banco de dados: ${err.message}` });
  }
});

app.delete('/api/credit-cards/:id', async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;

  if (!pool) {
    const index = mockCreditCards.findIndex(c => c.id === parseInt(id) && c.user_id === userId);
    if (index === -1) return res.status(404).json({ error: 'Cartão não encontrado' });
    mockCreditCards.splice(index, 1);
    return res.json({ message: 'Deletado com sucesso' });
  }

  try {
    const result = await pool.query('DELETE FROM credit_cards WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }
    res.json({ message: 'Deletado com sucesso' });
  } catch (err) {
    console.error('[ERROR SQL /api/credit-cards/:id]:', err.message);
    res.status(500).json({ error: `Erro no banco de dados: ${err.message}` });
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
  const { name, target, current, deadline, color, icon } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO goals (user_id, name, target, current, deadline, color, icon) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, name, target, current, deadline, color, icon]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/goals/:id', async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;
  const { name, target, current, deadline, color, icon } = req.body;

  if (!pool) {
    const index = mockGoals.findIndex(g => g.id === parseInt(id) && g.user_id === userId);
    if (index === -1) return res.status(404).json({ error: 'Meta não encontrada' });
    mockGoals[index] = { ...mockGoals[index], ...req.body };
    return res.json(mockGoals[index]);
  }

  try {
    const result = await pool.query(
      'UPDATE goals SET name = $1, target = $2, current = $3, deadline = $4, color = $5, icon = $6 WHERE id = $7 AND user_id = $8 RETURNING *',
      [name, target, current, deadline, color, icon, id, userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Meta não encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/goals/:id', async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;

  if (!pool) {
    const index = mockGoals.findIndex(g => g.id === parseInt(id) && g.user_id === userId);
    if (index === -1) return res.status(404).json({ error: 'Meta não encontrada' });
    mockGoals.splice(index, 1);
    return res.json({ message: 'Deletado com sucesso' });
  }

  try {
    const result = await pool.query('DELETE FROM goals WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Meta não encontrada' });
    res.json({ message: 'Deletado com sucesso' });
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
    const user = mockUsers.find(u => u.id === userId);
    const userSettings = mockSettings.find(s => s.user_id === userId);
    
    const response = {
      userName: userSettings?.user_name || userSettings?.userName || user?.username || 'Usuário',
      email: user?.email || userSettings?.email || '',
      currency: userSettings?.currency || 'BRL',
      language: userSettings?.language || 'pt-BR',
      notificationsEnabled: userSettings?.notifications_enabled ?? userSettings?.notificationsEnabled ?? true,
      alertDaysBefore: userSettings?.alert_days_before ?? userSettings?.alertDaysBefore ?? 3,
      monthlyBudget: userSettings?.monthly_budget ?? userSettings?.monthlyBudget ?? 8000,
      darkMode: userSettings?.dark_mode ?? userSettings?.darkMode ?? true,
      systemName: userSettings?.system_name || userSettings?.systemName || defaultSystemName,
    };
    res.json(response);
    return;
  }

  try {
    const result = await pool.query('SELECT * FROM settings WHERE user_id = $1', [userId]);
    const row = result.rows[0];
    
    // Always get current email and username from users table to ensure it's fresh
    const userRes = await pool.query('SELECT username, email FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];

    if (!row) {
      return res.json({
        userName: user?.username || 'Usuário',
        email: user?.email || '',
        currency: 'BRL',
        language: 'pt-BR',
        notificationsEnabled: true,
        alertDaysBefore: 3,
        monthlyBudget: 8000,
        darkMode: true,
        systemName: defaultSystemName
      });
    }

    res.json({
      userName: row.user_name || user?.username,
      email: user?.email || row.email,
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

// Change Password
app.post('/api/settings/change-password', async (req, res) => {
  const userId = getUserId(req);
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
  }

  try {
    if (pool) {
      const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
      const user = result.rows[0];

      if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
        return res.status(401).json({ error: 'Senha atual incorreta' });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedNewPassword, userId]);
      
      addLog('INFO', `Usuário alterou a senha`, req.user.username);
      res.json({ message: 'Senha alterada com sucesso' });
    } else {
      const user = mockUsers.find(u => u.id === userId);
      if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
        return res.status(401).json({ error: 'Senha atual incorreta' });
      }
      user.password_hash = await bcrypt.hash(newPassword, 10);
      res.json({ message: 'Senha alterada com sucesso' });
    }
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

// Import API
app.post('/api/import', upload.single('file'), async (req, res) => {
  const userId = getUserId(req);
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet(1);
    
    let success = 0;
    let failed = 0;
    const errors = [];

    // Skip header row
    const rows = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const rowData = {
          date: row.getCell(1).value,
          description: row.getCell(2).value,
          category: row.getCell(3).value,
          type: row.getCell(4).value,
          amount: row.getCell(5).value,
          account: row.getCell(6).value,
          notes: row.getCell(7).value,
        };
        // Basic validation: skip empty rows
        if (rowData.date && rowData.amount) {
          rows.push(rowData);
        }
      }
    });

    for (const rowData of rows) {
      try {
        let { date, description, category, type, amount, account, notes } = rowData;

        // Process Date
        if (date instanceof Date) {
          date = date.toISOString().split('T')[0];
        } else if (typeof date === 'string') {
          // simple check for yyyy-mm-dd
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new Error(`Data inválida: ${date}`);
          }
        }

        // Process Amount
        if (typeof amount === 'string') {
          amount = parseFloat(amount.replace(',', '.'));
        }
        if (isNaN(amount)) {
          throw new Error(`Valor inválido: ${amount}`);
        }

        // Process Type
        if (!['income', 'expense'].includes(type)) {
          throw new Error(`Tipo inválido: ${type}. Use income ou expense.`);
        }

        if (pool) {
          // 1. Get or Create Account
          let accountId;
          const accountRes = await pool.query('SELECT id FROM accounts WHERE user_id = $1 AND name = $2', [userId, account]);
          if (accountRes.rows.length > 0) {
            accountId = accountRes.rows[0].id;
          } else {
            const newAcc = await pool.query(
              'INSERT INTO accounts (user_id, name, balance, icon, color, type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
              [userId, account, 0, '💳', 'hsl(var(--primary))', 'checking']
            );
            accountId = newAcc.rows[0].id;
          }

          // 2. Insert Transaction
          await pool.query(
            'INSERT INTO transactions (user_id, account_id, type, amount, category, description, date) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [userId, accountId, type, amount, category, description, date]
          );
        } else {
          // Mock data fallback
          let accountId;
          const existingAcc = mockAccounts.find(a => a.user_id === userId && a.name === account);
          if (existingAcc) {
            accountId = existingAcc.id;
          } else {
            accountId = mockAccounts.length + 1;
            mockAccounts.push({
              id: accountId,
              user_id: userId,
              name: account,
              balance: 0,
              icon: "💳",
              color: "hsl(var(--primary))",
              type: "checking"
            });
          }

          mockTransactions.push({
            id: mockTransactions.length + 1,
            user_id: userId,
            account_id: accountId,
            type,
            amount,
            category,
            description,
            date
          });
        }
        success++;
      } catch (err) {
        failed++;
        errors.push(`Erro na linha: ${err.message}`);
      }
    }

    addLog('INFO', `Importação concluída: ${success} sucesso, ${failed} falha`, req.user.username);
    res.json({ success, failed, errors });
  } catch (error) {
    console.error('[ERROR] Erro ao processar importação:', error);
    res.status(500).json({ error: 'Erro ao processar o arquivo Excel' });
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
    // Run recurring rule processor every hour
    setInterval(processRecurringRules, 3600000);
  });
}

// Export for Vercel serverless
export default app;
