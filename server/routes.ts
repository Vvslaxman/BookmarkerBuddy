import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { suggestTags } from "./openai";
import { insertBookmarkSchema, users } from "@shared/schema";
import { db } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);
  
  app.get("/api/health", async (req, res) => {
    try {
      // Test database connection
      await db.select().from(users).limit(1);
      res.json({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        database: "connected"
      });
    } catch (error) {
      res.status(500).json({ 
        status: "error", 
        message: "Database connection failed"
      });
    }
  });
  // Get all bookmarks for the authenticated user
  app.get("/api/bookmarks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const bookmarks = await storage.getBookmarks(req.user!.id);
    res.json(bookmarks);
  });

  // Create a new bookmark
  app.post("/api/bookmarks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const parsed = insertBookmarkSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid bookmark data" });
    }

    const bookmark = await storage.createBookmark(req.user!.id, parsed.data);
    res.status(201).json(bookmark);
  });

  // Update a bookmark
  app.patch("/api/bookmarks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const bookmark = await storage.getBookmark(parseInt(req.params.id));
    if (!bookmark || bookmark.userId !== req.user!.id) {
      return res.status(404).json({ error: "Bookmark not found" });
    }

    const parsed = insertBookmarkSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid bookmark data" });
    }

    const updated = await storage.updateBookmark(bookmark.id, parsed.data);
    res.json(updated);
  });

  // Delete a bookmark
  app.delete("/api/bookmarks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const bookmark = await storage.getBookmark(parseInt(req.params.id));
    if (!bookmark || bookmark.userId !== req.user!.id) {
      return res.status(404).json({ error: "Bookmark not found" });
    }

    await storage.deleteBookmark(bookmark.id);
    res.sendStatus(204);
  });

  // Search bookmarks
  app.get("/api/bookmarks/search", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: "Search query required" });
    }

    const results = await storage.searchBookmarks(req.user!.id, query);
    res.json(results);
  });

  // Get bookmark statistics
  app.get("/api/bookmarks/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const stats = await storage.getBookmarkStats(req.user!.id);
    res.json(stats);
  });

  // Get AI tag suggestions
  app.post("/api/tags/suggest", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { url, title, description } = req.body;
    if (!url || !title) {
      return res.status(400).json({ error: "URL and title are required" });
    }

    const result = await suggestTags(url, title, description || "");
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ tags: result.tags });
  });

  const httpServer = createServer(app);
  return httpServer;
}