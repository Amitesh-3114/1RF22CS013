const express = require("express");
const shortid = require("shortid");

const router = express.Router();

// In-memory store (replace with DB if needed)
const urlDatabase = {};

// Create a short URL
router.post("/shorten", (req, res) => {
  const { originalUrl } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ error: "Original URL is required" });
  }

  const shortCode = shortid.generate();
  urlDatabase[shortCode] = originalUrl;

  res.json({
    shortUrl: `http://localhost:5001/api/${shortCode}`,
    originalUrl
  });
});

// Redirect to original URL
router.get("/:shortCode", (req, res) => {
  const { shortCode } = req.params;
  const originalUrl = urlDatabase[shortCode];

  if (!originalUrl) {
    return res.status(404).json({ error: "Short URL not found" });
  }

  res.redirect(originalUrl);
});

module.exports = router;
