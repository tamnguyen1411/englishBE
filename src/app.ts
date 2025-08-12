import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./db/db";
import authRoutes from "./routes/auth.routes";
import promptRoutes from "./routes/prompt.routes";
import commentRoutes from "./routes/comment.routes";
import aiRoutes from "./routes/ai.route";
dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes); 
app.use("/api/prompts", promptRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/ai", aiRoutes);
app.get("/", (_, res) => res.send("API is running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
