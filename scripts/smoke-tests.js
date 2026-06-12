const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = http.request(opts, (res) => {
      let b = '';
      res.on('data', (c) => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', (e) => reject(e));
    req.write(data);
    req.end();
  });
}

(async () => {
  try {
    console.log('Registering test user...');
    let r = await post('/api/auth/register', { name: 'Smoke Tester', email: 'smoke+1@example.com', password: 'Password123!', confirmPassword: 'Password123!' });
    console.log('Register:', r.status, r.body.slice(0,200));

    console.log('Logging in...');
    r = await post('/api/auth/login', { email: 'smoke+1@example.com', password: 'Password123!' });
    console.log('Login:', r.status, r.body.slice(0,200));

    // Additional smoke checks would require multipart/form-data or sockets; skip heavy checks for now
    console.log('Basic auth smoke tests completed.');
    process.exit(0);
  } catch (err) {
    console.error('Smoke test failed:', err);
    process.exit(2);
  }
})();
