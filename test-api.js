import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Iniciando testes da API...\n');

  try {
    // Test 1: Criar usuário admin
    console.log('1️⃣ Testando criação de usuário...');
    const registerRes = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      })
    });

    if (registerRes.ok) {
      const userData = await registerRes.json();
      console.log('✅ Usuário criado:', userData.user.username);
      console.log('🔑 Token gerado:', userData.token.substring(0, 20) + '...');

      // Test 2: Login
      console.log('\n2️⃣ Testando login...');
      const loginRes = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });

      if (loginRes.ok) {
        const loginData = await loginRes.json();
        console.log('✅ Login realizado:', loginData.user.username);

        const token = loginData.token;

        // Test 3: Criar conta
        console.log('\n3️⃣ Testando criação de conta...');
        const accountRes = await fetch(`${BASE_URL}/api/accounts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: 'Conta Teste',
            balance: 1000,
            icon: '💰',
            color: 'blue',
            type: 'checking'
          })
        });

        if (accountRes.ok) {
          const accountData = await accountRes.json();
          console.log('✅ Conta criada:', accountData.name, '- Saldo:', accountData.balance);

          // Test 4: Buscar contas
          console.log('\n4️⃣ Testando busca de contas...');
          const accountsRes = await fetch(`${BASE_URL}/api/accounts`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (accountsRes.ok) {
            const accounts = await accountsRes.json();
            console.log('✅ Contas encontradas:', accounts.length);

            // Test 5: Criar transação
            console.log('\n5️⃣ Testando criação de transação...');
            const transactionRes = await fetch(`${BASE_URL}/api/transactions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                account_id: accountData.id,
                type: 'expense',
                amount: 50,
                category: 'Alimentação',
                description: 'Teste de transação',
                date: new Date().toISOString().split('T')[0]
              })
            });

            if (transactionRes.ok) {
              const transactionData = await transactionRes.json();
              console.log('✅ Transação criada:', transactionData.description, '- Valor:', transactionData.amount);

              // Test 6: Buscar transações
              console.log('\n6️⃣ Testando busca de transações...');
              const transactionsRes = await fetch(`${BASE_URL}/api/transactions`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (transactionsRes.ok) {
                const transactions = await transactionsRes.json();
                console.log('✅ Transações encontradas:', transactions.length);

                // Test 7: Verificar saldo da conta
                console.log('\n7️⃣ Verificando atualização de saldo...');
                const updatedAccountsRes = await fetch(`${BASE_URL}/api/accounts`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });

                if (updatedAccountsRes.ok) {
                  const updatedAccounts = await updatedAccountsRes.json();
                  const testAccount = updatedAccounts.find(a => a.id === accountData.id);
                  if (testAccount) {
                    console.log('✅ Saldo atualizado:', testAccount.balance, '(era 1000, deve ser 950)');
                  }
                }
              }
            }
          }
        }

        // Test 8: Testar admin (se for admin)
        if (loginData.user.id === 1) {
          console.log('\n8️⃣ Testando painel admin...');
          const adminUsersRes = await fetch(`${BASE_URL}/api/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (adminUsersRes.ok) {
            const users = await adminUsersRes.json();
            console.log('✅ Usuários no sistema:', users.length);

            const logsRes = await fetch(`${BASE_URL}/api/admin/logs`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (logsRes.ok) {
              const logs = await logsRes.json();
              console.log('✅ Logs do sistema:', logs.length);
            }
          }
        }

      } else {
        console.log('❌ Falha no login');
      }

    } else {
      console.log('❌ Falha na criação de usuário:', await registerRes.text());
    }

  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
  }

  console.log('\n🎉 Testes concluídos!');
}

// Executar apenas se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testAPI();
}

export { testAPI };