// File: backend/src/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic route for testing
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Bookzoi API is running" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
