
import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import type { Bookmark, User } from "@shared/schema";

type DemoContextType = {
  isDemoMode: boolean;
  demoUser: User | null;
  demoBookmarks: Bookmark[];
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  addDemoBookmark: (bookmark: Omit<Bookmark, 'id' | 'userId' | 'createdAt' | 'lastAccessedAt' | 'lastModifiedAt' | 'accessCount'>) => void;
  updateDemoBookmark: (id: number, updates: Partial<Bookmark>) => void;
  deleteDemoBookmark: (id: number) => void;
  getDemoStats: () => {
    totalBookmarks: number;
    mostAccessed: Bookmark[];
    recentlyCreated: Bookmark[];
    recentlyAccessed: Bookmark[];
  };
};

const DemoContext = createContext<DemoContextType | null>(null);

const DEMO_USER: User = {
  id: 999,
  username: "demo_user",
  email: "demo@example.com",
  fullName: "Recruiter",
  password: ""
};

const INITIAL_DEMO_BOOKMARKS: Bookmark[] = [
  {
    id: 1,
    userId: 999,
    url: "https://github.com",
    title: "GitHub - Developer Platform",
    description: "GitHub is where developers build, ship, and maintain software.",
    tags: ["development", "git", "coding", "collaboration"],
    createdAt: new Date("2024-01-15"),
    lastAccessedAt: new Date("2024-01-20"),
    lastModifiedAt: new Date("2024-01-15"),
    accessCount: 15
  },
  {
    id: 2,
    userId: 999,
    url: "https://stackoverflow.com",
    title: "Stack Overflow - Programming Q&A",
    description: "Stack Overflow is the largest online community for programmers to learn and share knowledge.",
    tags: ["programming", "q&a", "community", "help"],
    createdAt: new Date("2024-01-10"),
    lastAccessedAt: new Date("2024-01-19"),
    lastModifiedAt: new Date("2024-01-10"),
    accessCount: 28
  },
  {
    id: 3,
    userId: 999,
    url: "https://react.dev",
    title: "React - JavaScript Library",
    description: "A JavaScript library for building user interfaces with component-based architecture.",
    tags: ["react", "javascript", "frontend", "ui"],
    createdAt: new Date("2024-01-12"),
    lastAccessedAt: new Date("2024-01-18"),
    lastModifiedAt: new Date("2024-01-12"),
    accessCount: 22
  },
  {
    id: 4,
    userId: 999,
    url: "https://tailwindcss.com",
    title: "Tailwind CSS - Utility-First Framework",
    description: "A utility-first CSS framework for rapidly building custom user interfaces.",
    tags: ["css", "framework", "design", "styling"],
    createdAt: new Date("2024-01-08"),
    lastAccessedAt: new Date("2024-01-17"),
    lastModifiedAt: new Date("2024-01-08"),
    accessCount: 12
  },
  {
    id: 5,
    userId: 999,
    url: "https://vercel.com",
    title: "Vercel - Frontend Cloud Platform",
    description: "Deploy and scale your frontend applications with ease on Vercel's platform.",
    tags: ["deployment", "hosting", "frontend", "cloud"],
    createdAt: new Date("2024-01-14"),
    lastAccessedAt: new Date("2024-01-16"),
    lastModifiedAt: new Date("2024-01-14"),
    accessCount: 8
  }
];

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoBookmarks, setDemoBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('demo-bookmarks');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDemoBookmarks(parsed.map((b: any) => ({
          ...b,
          createdAt: new Date(b.createdAt),
          lastAccessedAt: new Date(b.lastAccessedAt),
          lastModifiedAt: new Date(b.lastModifiedAt)
        })));
      } catch {
        setDemoBookmarks(INITIAL_DEMO_BOOKMARKS);
      }
    } else {
      setDemoBookmarks(INITIAL_DEMO_BOOKMARKS);
    }
  }, []);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('demo-bookmarks', JSON.stringify(demoBookmarks));
    }
  }, [demoBookmarks, isDemoMode]);

  const enterDemoMode = () => {
    setIsDemoMode(true);
    setDemoBookmarks(INITIAL_DEMO_BOOKMARKS);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    localStorage.removeItem('demo-bookmarks');
  };

  const addDemoBookmark = (bookmark: Omit<Bookmark, 'id' | 'userId' | 'createdAt' | 'lastAccessedAt' | 'lastModifiedAt' | 'accessCount'>) => {
    const now = new Date();
    const newBookmark: Bookmark = {
      ...bookmark,
      id: Math.max(...demoBookmarks.map(b => b.id), 0) + 1,
      userId: 999,
      createdAt: now,
      lastAccessedAt: now,
      lastModifiedAt: now,
      accessCount: 0
    };
    setDemoBookmarks(prev => [...prev, newBookmark]);
  };

  const updateDemoBookmark = (id: number, updates: Partial<Bookmark>) => {
    setDemoBookmarks(prev => prev.map(bookmark => 
      bookmark.id === id 
        ? { ...bookmark, ...updates, lastModifiedAt: new Date() }
        : bookmark
    ));
  };

  const deleteDemoBookmark = (id: number) => {
    setDemoBookmarks(prev => prev.filter(bookmark => bookmark.id !== id));
  };

  const getDemoStats = () => {
    const sortedByAccess = [...demoBookmarks].sort((a, b) => b.accessCount - a.accessCount);
    const sortedByCreated = [...demoBookmarks].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const sortedByAccessed = [...demoBookmarks].sort((a, b) => b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime());

    return {
      totalBookmarks: demoBookmarks.length,
      mostAccessed: sortedByAccess.slice(0, 5),
      recentlyCreated: sortedByCreated.slice(0, 5),
      recentlyAccessed: sortedByAccessed.slice(0, 5),
    };
  };

  return (
    <DemoContext.Provider value={{
      isDemoMode,
      demoUser: isDemoMode ? DEMO_USER : null,
      demoBookmarks,
      enterDemoMode,
      exitDemoMode,
      addDemoBookmark,
      updateDemoBookmark,
      deleteDemoBookmark,
      getDemoStats
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
}
