const express = require('express');
const app = express();
const PORT = 5000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.get('/api/auth/check', (req, res) => {
  res.json({ authenticated: false });
});

app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Auth check: http://localhost:${PORT}/api/auth/check`);
});