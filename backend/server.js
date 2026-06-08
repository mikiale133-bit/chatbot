import express from "express";
import axios from "axios";
import "dotenv/config";
import cors from "cors";
import chatRouter from "./routes/chatRoutes.js";
import mongoose from "mongoose";
//import connectDB from "./config/db.js";

// dotenv.config();

const app = express();
//connectDB();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected..."))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;

// Chat route
app.use("/api/chat", chatRouter);

app.listen(PORT, () => {
  console.log(`Server running on  http://localhost:${PORT}`);
});
