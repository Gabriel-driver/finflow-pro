import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function createAdminUser() {
  try {
    console.log('🔧 Verificando conexão com o banco...');

    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Conectado ao banco Neon!');

    // Check if admin user exists
    const existingAdmin = await pool.query('SELECT id FROM users WHERE id = 1');
    if (existingAdmin.rows.length > 0) {
      console.log('ℹ️ Admin já existe (ID: 1)');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.query(
      'INSERT INTO users (id, username, email, password_hash) VALUES ($1, $2, $3, $4)',
      [1, 'admin', 'admin@finflow.com', hashedPassword]
    );

    console.log('✅ Usuário admin criado!');
    console.log('👤 Login: admin@finflow.com');
    console.log('🔑 Senha: admin123');

  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser();