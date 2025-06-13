const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve the AI Music/Video Studio at /studio
app.use('/studio', express.static(path.join(__dirname, 'AI_Movie_Studio_Pro_Production_Ready')));

// Home route
app.get('/', (req, res) => {
  res.send(`
    <h1>✅ Welcome, Ervin</h1>
    <p>Your Express server is secure and working.</p>
    <p>🎵 AI Music & Video Studio is available at <a href="/studio">/studio</a></p>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
