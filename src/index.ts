import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import routes from "./routes";
import { authService } from "./services";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.middleware";
import { requestLogger, logger } from "./utils/logger";
import { RateLimiters } from "./middleware/rate-limiter.middleware";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Request logging
app.use(requestLogger());

// Global rate limiting
app.use(RateLimiters.standard());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api", routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  try {
    await AppDataSource.destroy();
    logger.info("Database connection closed");
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown", error as Error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.fatal("Uncaught Exception", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.fatal("Unhandled Rejection", reason as Error);
  process.exit(1);
});

// Initialize database and start server
AppDataSource.initialize()
  .then(async () => {
    logger.info("Database connected successfully");

    // Seed default admin user
    await authService.seedAdmin();

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`API available at http://localhost:${PORT}/api`);
      logger.info(`Health check at http://localhost:${PORT}/health`);
    });
  })
  .catch((error) => {
    logger.fatal("Error during database connection", error);
    process.exit(1);
  });

export default app;
