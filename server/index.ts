import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import helmet from "helmet";
import path from "path";

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled because we're using Vite in development
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  const isDev = app.get("env") === "development";

  if (isDev) {
    await setupVite(app, server);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(process.cwd(), "dist", "public")));
    
    // Serve static assets if they exist
    app.use("/assets", express.static(path.join(process.cwd(), "dist", "public", "assets")));

    // Handle SPA routing - serve index.html for all non-API routes
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      res.sendFile(path.join(process.cwd(), "dist", "public", "index.html"), (err) => {
        if (err) {
          res.status(500).send("Error loading application");
        }
      });
    });
  }

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ 
      error: true,
      message,
      ...(isDev ? { stack: err.stack } : {})
    });
  });

  // Handle 404 errors for API routes
  app.use("/api/*", (_req: Request, res: Response) => {
    res.status(404).json({ error: true, message: "API endpoint not found" });
  });

  const PORT = parseInt(process.env.PORT || "5000", 10);
  server.listen(PORT, "0.0.0.0", () => {
    log(`Server running in ${app.get("env")} mode on port ${PORT}`);
  });
})();