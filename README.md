# FinFlow Pro

Aplicação de controle financeiro pessoal com frontend React e backend Node.js.

## 🚀 Configuração

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
Copie o arquivo de exemplo e configure suas variáveis:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

#### Variáveis obrigatórias:
- `JWT_SECRET`: Chave secreta para autenticação JWT (use uma string segura)
- `DATABASE_URL`: URL de conexão com PostgreSQL (Neon)

#### Exemplo de configuração:
```env
NODE_ENV=development
PORT=3000
JWT_SECRET=minha-chave-secreta-super-segura
DATABASE_URL=postgresql://usuario:senha@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 3. Configurar banco de dados
1. Acesse [Neon Console](https://console.neon.tech/)
2. Crie um novo projeto ou selecione um existente
3. Vá em "Connection Details" e copie a connection string
4. Cole no `.env` como `DATABASE_URL`

### 4. Executar aplicação
```bash
# Desenvolvimento (frontend + backend simultaneamente)
npm run dev

# Apenas backend
npm start

# Build para produção
npm run build
```

## 🧪 Testes

### Testes Unitários
```bash
npm test
```

### Testes E2E (Playwright)
```bash
# Instalar browsers do Playwright (primeira vez)
npx playwright install

# Executar testes E2E
npm run test:e2e

# Executar com interface visual
npm run test:e2e:ui
```

**Nota:** Os testes E2E requerem que o servidor esteja rodando. Execute `npm run dev` em um terminal separado antes de rodar os testes.

## 📁 Estrutura do projeto

- `src/`: Código fonte do frontend (React + TypeScript)
- `server.js`: Servidor backend (Express + PostgreSQL)
- `schema.sql`: Schema do banco de dados
- `dist/`: Arquivos buildados do frontend

## 🔧 Scripts disponíveis

- `npm run dev`: Inicia desenvolvimento (frontend + backend)
- `npm start`: Inicia apenas o servidor backend
- `npm run build`: Build do frontend para produção
- `npm run preview`: Preview do build

## 🚀 Deploy no Vercel

1. Faça push do código para GitHub
2. Conecte o repositório no Vercel
3. Configure as variáveis de ambiente no painel do Vercel
4. Deploy automático!

## 📝 Funcionalidades

- ✅ Controle de contas bancárias
- ✅ Gestão de transações (receitas/despesas)
- ✅ Categorias personalizáveis
- ✅ Cartões de crédito
- ✅ Metas financeiras
- ✅ Orçamentos mensais
- ✅ Relatórios e gráficos
- ✅ Notificações
- ✅ Autenticação de usuários
