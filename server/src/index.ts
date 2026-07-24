import express from "express";
import cors from "cors";
import vehicleRoutes from "./routes/vehicles.js";
import expenseRoutes from "./routes/expenses.js";
import fileRoutes from "./routes/files.js";
import reminderRoutes from "./routes/reminders.js";

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health check
app.get("/api/v1/health", (_req, res) => {
  console.log("Health check success");
  res.status(200).json({ status: "ok" });
});

// Routes
app.use("/api/v1/vehicles", vehicleRoutes);
app.use("/api/v1/expenses", expenseRoutes);
app.use("/api/v1/files", fileRoutes);
app.use("/api/v1/reminders", reminderRoutes);

// Multer error handling
app.use((err: Error & { code?: string }, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    res.status(413).json({ error: "文件大小超过限制（最大 50MB）" });
    return;
  }
  next(err);
});

// General error handling
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Server error:", err.message);
  res.status(500).json({ error: err.message || "服务器内部错误" });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
