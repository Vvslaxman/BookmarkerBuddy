import { users, bookmarks, type User, type InsertUser, type Bookmark, type InsertBookmark } from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getBookmarks(userId: number): Promise<Bookmark[]> {
    return await db.select().from(bookmarks).where(eq(bookmarks.userId, userId));
  }

  async getBookmark(id: number): Promise<Bookmark | undefined> {
    const [bookmark] = await db.select().from(bookmarks).where(eq(bookmarks.id, id));
    if (bookmark) {
      // Update access count and last accessed timestamp
      await db.update(bookmarks)
        .set({
          accessCount: sql`${bookmarks.accessCount} + 1`,
          lastAccessedAt: new Date()
        })
        .where(eq(bookmarks.id, id));
    }
    return bookmark;
  }

  async createBookmark(userId: number, insertBookmark: InsertBookmark): Promise<Bookmark> {
    const now = new Date();
    const [bookmark] = await db
      .insert(bookmarks)
      .values({
        ...insertBookmark,
        userId,
        createdAt: now,
        lastAccessedAt: now,
        lastModifiedAt: now,
        accessCount: 0
      })
      .returning();
    return bookmark;
  }

  async updateBookmark(id: number, updateData: Partial<InsertBookmark>): Promise<Bookmark> {
    const [bookmark] = await db
      .update(bookmarks)
      .set({
        ...updateData,
        lastModifiedAt: new Date()
      })
      .where(eq(bookmarks.id, id))
      .returning();
    return bookmark;
  }

  async deleteBookmark(id: number): Promise<void> {
    await db.delete(bookmarks).where(eq(bookmarks.id, id));
  }

  async searchBookmarks(userId: number, query: string): Promise<Bookmark[]> {
    const searchTerms = query.toLowerCase().split(" ");
    const results = await db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          ilike(
            bookmarks.title,
            `%${searchTerms[0]}%`
          )
        )
      );

    return results.filter((bookmark) => {
      const searchText = `${bookmark.title} ${bookmark.description} ${bookmark.tags.join(" ")}`.toLowerCase();
      return searchTerms.every(term => searchText.includes(term));
    });
  }

  async getBookmarkStats(userId: number): Promise<{
    totalBookmarks: number;
    mostAccessed: Bookmark[];
    recentlyCreated: Bookmark[];
    recentlyAccessed: Bookmark[];
  }> {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId));

    const mostAccessed = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(sql`${bookmarks.accessCount} DESC`)
      .limit(5);

    const recentlyCreated = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(sql`${bookmarks.createdAt} DESC`)
      .limit(5);

    const recentlyAccessed = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(sql`${bookmarks.lastAccessedAt} DESC`)
      .limit(5);

    return {
      totalBookmarks: count,
      mostAccessed,
      recentlyCreated,
      recentlyAccessed,
    };
  }
}

export const storage = new DatabaseStorage();