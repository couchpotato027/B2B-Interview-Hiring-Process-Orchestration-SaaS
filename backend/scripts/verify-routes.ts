import http from 'http';

const endpoints = [
  { path: '/api/health', method: 'GET' },
  { path: '/debug/routes', method: 'GET' },
  { path: '/api/v1/candidates', method: 'GET' },
  { path: '/api/v1/jobs', method: 'GET' },
  { path: '/api/v1/pipelines', method: 'GET' },
  { path: '/api/v1/dashboard/stats', method: 'GET' },
  { path: '/api/candidates', method: 'GET' },
  { path: '/api/auth/login', method: 'POST' }
];

async function verify() {
  console.log('🔍 Starting Route Verification...\n');
  
  for (const ep of endpoints) {
    try {
      const result = await testEndpoint(ep.path, ep.method);
      const status = result >= 200 && result < 400 ? '✅ OK' : result === 401 ? '🔒 AUTH_REQUIRED (EXPECTED)' : '❌ FAILED';
      console.log(`${status} [${result}] ${ep.method} http://localhost:3001${ep.path}`);
    } catch (err: any) {
      console.log(`❌ ERROR [CONN] ${ep.method} http://localhost:3001${ep.path} - ${err.message}`);
    }
  }
}

function testEndpoint(path: string, method: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode || 0);
    });

    req.on('error', (e) => reject(e));
    if (method === 'POST') req.write(JSON.stringify({}));
    req.end();
  });
}

verify().then(() => console.log('\n✨ Verification Complete.'));
