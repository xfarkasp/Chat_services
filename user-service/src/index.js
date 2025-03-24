require("dotenv").config();
const cors = require("cors");
  
const express = require("express");
const { connectRedis } = require("./redis_client");
const userRoutes = require("./user_routes");

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:8000",
  methods: "GET,POST,PUT,DELETE",
  credentials: true
}));

// Connect to Redis
connectRedis();

// Use routes
app.use("/", userRoutes);

// Start the server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`User Service running on http://localhost:${PORT}`);
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});
