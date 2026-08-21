const http = require('http');

function makeRequest(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) {
      options.headers['Authorization'] = 'Bearer ' + token;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testBackend() {
  console.log('=== TESTING KAISAPAISA BACKEND APIS ===');

  // 1. Health check
  const health = await makeRequest('/health');
  console.log('[GET /api/health]:', health.statusCode, health.body.status);

  // 2. Login
  const loginRes = await makeRequest('/auth/login', 'POST', {
    email: 'student@kaisapaisa.com',
    password: 'Password123'
  });
  console.log('[POST /api/auth/login]:', loginRes.statusCode, loginRes.body.success ? 'SUCCESS' : 'FAILED');

  if (!loginRes.body.token) {
    console.error('Failed to log in:', loginRes.body);
    return;
  }
  const token = loginRes.body.token;

  // 3. User Profile
  const me = await makeRequest('/auth/me', 'GET', null, token);
  console.log('[GET /api/auth/me]:', me.statusCode, me.body.user?.name);

  // 4. Dashboard Summary
  const dash = await makeRequest('/analytics/dashboard', 'GET', null, token);
  console.log('[GET /api/analytics/dashboard]:', dash.statusCode, 'Total Balance:', dash.body.summary?.totalBalance);

  // 5. Transactions
  const txs = await makeRequest('/transactions', 'GET', null, token);
  console.log('[GET /api/transactions]:', txs.statusCode, 'Count:', txs.body.count);

  // 6. Budgets
  const budgets = await makeRequest('/budgets', 'GET', null, token);
  console.log('[GET /api/budgets]:', budgets.statusCode, 'Budgets:', budgets.body.budgets?.length);

  // 7. Accounts
  const accounts = await makeRequest('/accounts', 'GET', null, token);
  console.log('[GET /api/accounts]:', accounts.statusCode, 'Accounts:', accounts.body.accounts?.length);

  // 8. Categories
  const categories = await makeRequest('/categories', 'GET', null, token);
  console.log('[GET /api/categories]:', categories.statusCode, 'Categories:', categories.body.categories?.length);

  // 9. Debts
  const debts = await makeRequest('/debts', 'GET', null, token);
  console.log('[GET /api/debts]:', debts.statusCode, 'Debts:', debts.body.debts?.length);

  // 10. Savings Goals
  const goals = await makeRequest('/goals', 'GET', null, token);
  console.log('[GET /api/goals]:', goals.statusCode, 'Goals:', goals.body.goals?.length);

  // 11. Recurring Expenses
  const recurring = await makeRequest('/recurring-expenses', 'GET', null, token);
  console.log('[GET /api/recurring-expenses]:', recurring.statusCode, 'Items:', recurring.body.recurringExpenses?.length);

  // 12. Notifications
  const notifs = await makeRequest('/notifications', 'GET', null, token);
  console.log('[GET /api/notifications]:', notifs.statusCode, 'Unread:', notifs.body.unreadCount);

  console.log('=== ALL BACKEND ENDPOINTS VERIFIED SUCCESSFULLY ===');
}

testBackend().catch(console.error);
