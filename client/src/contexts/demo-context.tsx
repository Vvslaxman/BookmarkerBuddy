
import { createContext, useContext, useState, ReactNode } from "react";
import type { Bookmark } from "@shared/schema";

interface DemoContextType {
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  demoBookmarks: Bookmark[];
  addDemoBookmark: (bookmark: Omit<Bookmark, 'id' | 'userId' | 'createdAt' | 'lastAccessedAt' | 'lastModifiedAt' | 'accessCount'>) => void;
  updateDemoBookmark: (id: number, bookmark: Partial<Bookmark>) => void;
  deleteDemoBookmark: (id: number) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

// Sample demo bookmarks
const initialDemoBookmarks: Bookmark[] = [
  {
    id: 1,
    userId: 999,
    url: "https://react.dev",
    title: "React Documentation",
    description: "The official React documentation with hooks, components, and best practices",
    tags: ["react", "frontend", "documentation", "javascript"],
    createdAt: new Date("2024-01-15"),
    lastAccessedAt: new Date("2024-01-20"),
    lastModifiedAt: new Date("2024-01-15"),
    accessCount: 15
  },
  {
    id: 2,
    userId: 999,
    url: "https://tailwindcss.com",
    title: "Tailwind CSS",
    description: "A utility-first CSS framework for rapidly building custom designs",
    tags: ["css", "framework", "styling", "design"],
    createdAt: new Date("2024-01-10"),
    lastAccessedAt: new Date("2024-01-22"),
    lastModifiedAt: new Date("2024-01-10"),
    accessCount: 8
  },
  {
    id: 3,
    userId: 999,
    url: "https://nodejs.org",
    title: "Node.js",
    description: "JavaScript runtime built on Chrome's V8 JavaScript engine",
    tags: ["nodejs", "backend", "javascript", "server"],
    createdAt: new Date("2024-01-12"),
    lastAccessedAt: new Date("2024-01-21"),
    lastModifiedAt: new Date("2024-01-12"),
    accessCount: 12
  },
  {
    id: 4,
    userId: 999,
    url: "https://github.com",
    title: "GitHub",
    description: "Version control and collaboration platform for developers",
    tags: ["git", "version-control", "collaboration", "development"],
    createdAt: new Date("2024-01-08"),
    lastAccessedAt: new Date("2024-01-23"),
    lastModifiedAt: new Date("2024-01-08"),
    accessCount: 25
  },
  {
    id: 5,
    userId: 999,
    url: "https://developer.mozilla.org",
    title: "MDN Web Docs",
    description: "The most trusted reference for web technologies",
    tags: ["documentation", "web", "javascript", "css", "html"],
    createdAt: new Date("2024-01-05"),
    lastAccessedAt: new Date("2024-01-19"),
    lastModifiedAt: new Date("2024-01-05"),
    accessCount: 30
  }
];

interface DemoProviderProps {
  children: ReactNode;
}

export function DemoProvider({ children }: DemoProviderProps) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoBookmarks, setDemoBookmarks] = useState<Bookmark[]>(initialDemoBookmarks);

  const setDemoMode = (enabled: boolean) => {
    setIsDemoMode(enabled);
    if (enabled) {
      // Reset to initial demo bookmarks when entering demo mode
      setDemoBookmarks(initialDemoBookmarks);
    }
  };

  const addDemoBookmark = (bookmark: Omit<Bookmark, 'id' | 'userId' | 'createdAt' | 'lastAccessedAt' | 'lastModifiedAt' | 'accessCount'>) => {
    const newBookmark: Bookmark = {
      ...bookmark,
      id: Date.now(),
      userId: 999,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      lastModifiedAt: new Date(),
      accessCount: 0
    };
    setDemoBookmarks(prev => [...prev, newBookmark]);
  };

  const updateDemoBookmark = (id: number, updates: Partial<Bookmark>) => {
    setDemoBookmarks(prev => 
      prev.map(bookmark => 
        bookmark.id === id 
          ? { ...bookmark, ...updates, lastModifiedAt: new Date() }
          : bookmark
      )
    );
  };

  const deleteDemoBookmark = (id: number) => {
    setDemoBookmarks(prev => prev.filter(bookmark => bookmark.id !== id));
  };

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        setDemoMode,
        demoBookmarks,
        addDemoBookmark,
        updateDemoBookmark,
        deleteDemoBookmark,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoContext() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error("useDemoContext must be used within a DemoProvider");
  }
  return context;
}
