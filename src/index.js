const express = require('express');
const path = require('path');
const urlsRouter = require('./routes/urls');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api', urlsRouter);

// Redirect route for short codes
app.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    const row = await db.getByShortCode(shortCode);
    if (!row) {
      return res.status(404).send('Short link not found');
    }
    await db.incrementVisits(row.id);
    // 302 redirect to original URL
    return res.redirect(row.original_url);
  } catch (err) {
    console.error('Redirect error:', err);
    return res.status(500).send('Internal Server Error');
  }
});

// Fallback route
app.use((req, res) => {
  res.status(404).send('Not Found');
});

// Start server after DB init
db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`URL Shortener app listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

module.exports = app;