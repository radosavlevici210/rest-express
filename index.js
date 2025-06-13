const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let items = [];
let nextId = 1;

app.get('/', (req, res) => {
  res.send('✅ REST Express API is running');
});

app.get('/items', (req, res) => {
  res.json(items);
});

app.post('/items', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const item = { id: nextId++, name };
  items.push(item);
  res.status(201).json(item);
});

app.get('/items/:id', (req, res) => {
  const item = items.find(i => i.id === +req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

app.put('/items/:id', (req, res) => {
  const item = items.find(i => i.id === +req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  item.name = req.body.name || item.name;
  res.json(item);
});

app.delete('/items/:id', (req, res) => {
  const index = items.findIndex(i => i.id === +req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Item not found' });
  items.splice(index, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
