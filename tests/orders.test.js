const { test, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const app = require('../server');

const FILE = path.join(__dirname, '..', 'stock.xlsx');

beforeEach(() => {
  if (fs.existsSync(FILE)) fs.unlinkSync(FILE);
});

test('saves order with phone, perfume and quantity', async () => {
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const port = server.address().port;

  const res = await fetch(`http://localhost:${port}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '12345', perfume: 'Test', quantity: 2 })
  });

  assert.strictEqual(res.status, 200);
  await res.json();

  const wb = XLSX.readFile(FILE);
  const ws = wb.Sheets['Pedidos'];
  const data = XLSX.utils.sheet_to_json(ws);
  assert.strictEqual(data.length, 1);
  assert.strictEqual(data[0].Telefono, '12345');
  assert.strictEqual(data[0].Perfume, 'Test');
  assert.strictEqual(data[0].Cantidad, 2);

  server.close();
});
