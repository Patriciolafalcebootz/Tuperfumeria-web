const express = require('express');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const app = express();
app.use(express.json());

const FILE = path.join(__dirname, 'stock.xlsx');
const STOCK_SHEET = 'Stock';
const ORDERS_SHEET = 'Pedidos';

let writePromise = Promise.resolve();

function runExclusive(task) {
  writePromise = writePromise.then(() => task());
  return writePromise;
}

function readWorkbook() {
  if (fs.existsSync(FILE)) {
    return XLSX.readFile(FILE);
  }
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet([]);
  XLSX.utils.book_append_sheet(wb, ws, STOCK_SHEET);
  XLSX.writeFile(wb, FILE);
  return wb;
}

app.get('/api/stock', (req, res) => {
  try {
    const wb = readWorkbook();
    const ws = wb.Sheets[STOCK_SHEET];
    const data = XLSX.utils.sheet_to_json(ws);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load stock' });
  }
});

app.post('/api/stock', (req, res) => {
  const items = req.body.items;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'items array required' });
  }

  runExclusive(async () => {
    const wb = readWorkbook();
    const ws = wb.Sheets[STOCK_SHEET];
    const data = XLSX.utils.sheet_to_json(ws);

    items.forEach(({ name, quantity }) => {
      const row = data.find(r => r.Producto === name);
      if (row) {
        row.Cantidad = Math.max(0, (row.Cantidad || 0) - quantity);
      }
    });

    wb.Sheets[STOCK_SHEET] = XLSX.utils.json_to_sheet(data);
    XLSX.writeFile(wb, FILE);
  }).then(() => {
    res.json({ success: true });
  }).catch(err => {
    console.error(err);
    res.status(500).json({ error: 'Failed to update stock' });
  });
});

app.post('/api/orders', (req, res) => {
  const { phone, perfume, quantity } = req.body || {};
  const qty = Number(quantity);
  if (!phone || !perfume || !Number.isInteger(qty)) {
    return res.status(400).json({ error: 'phone, perfume and quantity required' });
  }

  runExclusive(async () => {
    const wb = readWorkbook();
    let ws = wb.Sheets[ORDERS_SHEET];
    const data = ws ? XLSX.utils.sheet_to_json(ws) : [];
    data.push({ Telefono: phone, Perfume: perfume, Cantidad: qty, timestamp: new Date().toISOString() });
    ws = XLSX.utils.json_to_sheet(data);
    wb.Sheets[ORDERS_SHEET] = ws;
    if (!wb.SheetNames.includes(ORDERS_SHEET)) {
      wb.SheetNames.push(ORDERS_SHEET);
    }
    XLSX.writeFile(wb, FILE);
  }).then(() => {
    res.json({ success: true });
  }).catch(err => {
    console.error(err);
    res.status(500).json({ error: 'Failed to save order' });
  });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
