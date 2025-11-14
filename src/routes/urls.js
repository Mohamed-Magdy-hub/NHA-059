const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { generateShortCode } = require('../helpers/shortener');
const { isValidUrl } = require('../helpers/validator');

const SHORT_CODE_LENGTH = 7;

// POST /api/shorten
// Body: { url: "https://example.com" }
router.post('/shorten', async (req, res) => {
  try {
    const originalUrl = (req.body && (req.body.url || req.body.longUrl)) || req.query.url;
    if (!originalUrl) {
      return res.status(400).json({ error: 'Missing "url" in request body or query' });
    }

    if (!isValidUrl(originalUrl)) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    // Check if URL already exists: return existing short code to avoid duplicates
    const existing = await db.getByOriginalUrl(originalUrl);
    if (existing) {
      const base = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
      return res.json({
        shortCode: existing.short_code,
        shortUrl: `${base}/${existing.short_code}`,
        originalUrl: existing.original_url,
        visits: existing.visits,
        createdAt: existing.created_at
      });
    }

    // Generate unique short code (retry on collision)
    let shortCode;
    let attempts = 0;
    do {
      if (attempts++ > 10) {
        return res.status(500).json({ error: 'Failed to generate unique short code' });
      }
      shortCode = generateShortCode(SHORT_CODE_LENGTH);
      // eslint-disable-next-line no-await-in-loop
    } while (await db.getByShortCode(shortCode));

    const created = await db.createUrl(originalUrl, shortCode);
    const base = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    return res.status(201).json({
      id: created.id,
      shortCode: created.short_code,
      shortUrl: `${base}/${created.short_code}`,
      originalUrl: created.original_url,
      visits: created.visits,
      createdAt: created.created_at
    });
  } catch (err) {
    console.error('Error in POST /api/shorten:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/urls - list all shortened URLs
router.get('/urls', async (req, res) => {
  try {
    const rows = await db.getAll();
    const base = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const mapped = rows.map((r) => ({
      id: r.id,
      originalUrl: r.original_url,
      shortCode: r.short_code,
      shortUrl: `${base}/${r.short_code}`,
      visits: r.visits,
      createdAt: r.created_at
    }));
    return res.json(mapped);
  } catch (err) {
    console.error('Error in GET /api/urls:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;