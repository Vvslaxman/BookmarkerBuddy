import { IStorage } from "./storage";
import { User, InsertUser, Bookmark, InsertBookmark } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private bookmarks: Map<number, Bookmark>;
  private currentUserId: number;
  private currentBookmarkId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.bookmarks = new Map();
    this.currentUserId = 1;
    this.currentBookmarkId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user = { id, ...insertUser };
    this.users.set(id, user);
    return user;
  }

  async getBookmarks(userId: number): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values()).filter(
      (bookmark) => bookmark.userId === userId,
    );
  }

  async getBookmark(id: number): Promise<Bookmark | undefined> {
    return this.bookmarks.get(id);
  }

  async createBookmark(userId: number, insertBookmark: InsertBookmark): Promise<Bookmark> {
    const id = this.currentBookmarkId++;
    const bookmark = { id, userId, ...insertBookmark };
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }

  async updateBookmark(id: number, updateData: Partial<InsertBookmark>): Promise<Bookmark> {
    const bookmark = this.bookmarks.get(id);
    if (!bookmark) throw new Error("Bookmark not found");
    
    const updatedBookmark = { ...bookmark, ...updateData };
    this.bookmarks.set(id, updatedBookmark);
    return updatedBookmark;
  }

  async deleteBookmark(id: number): Promise<void> {
    this.bookmarks.delete(id);
  }

  async searchBookmarks(userId: number, query: string): Promise<Bookmark[]> {
    const userBookmarks = await this.getBookmarks(userId);
    const searchTerms = query.toLowerCase().split(" ");
    
    return userBookmarks.filter((bookmark) => {
      const searchText = `${bookmark.title} ${bookmark.description} ${bookmark.tags.join(" ")}`.toLowerCase();
      return searchTerms.every(term => searchText.includes(term));
    });
  }
}

export const storage = new MemStorage();
