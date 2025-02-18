import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled because we're using Vite in development
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log('\n🔍 Debug Log Start -------------------');
  console.log(`📝 ${new Date().toISOString()}`);
  console.log(`📍 ${req.method} ${req.url}`);
  console.log('🔒 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  const originalSend = res.send;
  res.send = function (body: any) {
    console.log('📤 Response:', typeof body === 'string' ? body : JSON.stringify(body, null, 2));
    console.log('🏁 Debug Log End -------------------\n');
    return originalSend.call(this, body);
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
    const publicPath = path.join(__dirname, '..', 'public');
    app.use(express.static(publicPath));

    // Add error handling middleware
    app.use((err: any, req: any, res: any, next: any) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    });

    // Handle SPA routing - Fixed by adding next parameter
    app.get('*', (req, res, next) => {
      try {
        if (req.path.startsWith('/api')) {
          return next();
        }
        const indexPath = path.join(__dirname, '..', 'public', 'index.html');
        console.log('Serving index.html from:', indexPath);
        res.sendFile(indexPath);
      } catch (error) {
        console.error('Error serving index.html:', error);
        res.status(500).send('Error loading application');
        next(error); // Pass error to error handling middleware
      }
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