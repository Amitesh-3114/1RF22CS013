const express = require("express");
const cors = require("cors");
const shortUrlRoutes = require("./src/routes/shorturls");

const app = express();
app.set("trust proxy", true);

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// Health check route
app.get("/health", (_, res) => res.json({ ok: true }));

// Short URL routes
app.use("/api", shortUrlRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
