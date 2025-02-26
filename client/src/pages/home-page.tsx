import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Search, Trash2, Tag, Edit2, BarChart2, Clock, Star, Filter } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Moon, Sun } from "lucide-react";
import type { Bookmark } from "@shared/schema";

type BookmarkStats = {
  totalBookmarks: number;
  mostAccessed: Bookmark[];
  recentlyCreated: Bookmark[];
  recentlyAccessed: Bookmark[];
};

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [newTag, setNewTag] = useState("");
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [newBookmark, setNewBookmark] = useState({
    url: "",
    title: "",
    description: "",
    tags: [] as string[],
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: bookmarks, isLoading } = useQuery<Bookmark[]>({
    queryKey: ["/api/bookmarks"],
  });

  const createMutation = useMutation({
    mutationFn: async (bookmark: typeof newBookmark) => {
      const res = await apiRequest("POST", "/api/bookmarks", bookmark);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      setIsDialogOpen(false);
      setNewBookmark({ url: "", title: "", description: "", tags: [] });
      toast({
        title: "Success",
        description: "Bookmark created successfully",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (bookmark: Partial<Bookmark>) => {
      const res = await apiRequest("PATCH", `/api/bookmarks/${bookmark.id}`, bookmark);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      setIsDialogOpen(false);
      setEditingBookmark(null);
      toast({
        title: "Success",
        description: "Bookmark updated successfully",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/bookmarks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({
        title: "Success",
        description: "Bookmark deleted successfully",
      });
    },
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery<BookmarkStats>({
    queryKey: ["/api/bookmarks/stats"],
  });

  const handleTagAdd = (formState: typeof newBookmark | Bookmark) => {
    if (!newTag.trim()) return;
    const updatedTags = [...formState.tags, newTag.trim()];
    if (editingBookmark) {
      setEditingBookmark({ ...editingBookmark, tags: updatedTags });
    } else {
      setNewBookmark({ ...newBookmark, tags: updatedTags });
    }
    setNewTag("");
  };

  const handleTagRemove = (index: number, formState: typeof newBookmark | Bookmark) => {
    const updatedTags = formState.tags.filter((_, i) => i !== index);
    if (editingBookmark) {
      setEditingBookmark({ ...editingBookmark, tags: updatedTags });
    } else {
      setNewBookmark({ ...newBookmark, tags: updatedTags });
    }
  };

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setIsDialogOpen(true);
  };

  
  const suggestTagsMutation = useMutation({
    mutationFn: async ({ url, title }: { url: string, title: string }) => {
      const res = await apiRequest("POST", "/api/tags/suggest", { url, title });
      return res.json();
    },
    onSuccess: (data) => {
      const newTags = data.tags.filter((tag: string) => 
        !(editingBookmark?.tags || newBookmark.tags).includes(tag)
      );
      if (editingBookmark) {
        setEditingBookmark({ ...editingBookmark, tags: [...editingBookmark.tags, ...newTags] });
      } else {
        setNewBookmark({ ...newBookmark, tags: [...newBookmark.tags, ...newTags] });
      }
    },
  });

  const handleURLChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    if (editingBookmark) {
      setEditingBookmark({ ...editingBookmark, url });
    } else {
      setNewBookmark({ ...newBookmark, url });
    }
    if (url && (editingBookmark?.title || newBookmark.title)) {
      suggestTagsMutation.mutate({ 
        url, 
        title: editingBookmark?.title || newBookmark.title 
      });
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    if (editingBookmark) {
      setEditingBookmark({ ...editingBookmark, title });
    } else {
      setNewBookmark({ ...newBookmark, title });
    }
    if (title && (editingBookmark?.url || newBookmark.url)) {
      suggestTagsMutation.mutate({ 
        url: editingBookmark?.url || newBookmark.url, 
        title 
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBookmark) {
      updateMutation.mutate(editingBookmark);
    } else {
      createMutation.mutate(newBookmark);
    }
  };

  // Extract unique tags from all bookmarks
  const allTags = useMemo(() => {
    if (!bookmarks) return [];
    const tagSet = new Set<string>();
    bookmarks.forEach(bookmark => {
      bookmark.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [bookmarks]);

  // Filter bookmarks based on search and tags
  const filteredBookmarks = useMemo(() => {
    if (!bookmarks) return [];
    return bookmarks.filter(bookmark => {
      const matchesSearch = !search ||
        bookmark.title.toLowerCase().includes(search.toLowerCase()) ||
        bookmark.description?.toLowerCase().includes(search.toLowerCase()) ||
        bookmark.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));

      const matchesTags = selectedTags.length === 0 ||
        selectedTags.every(tag => bookmark.tags.includes(tag));

      return matchesSearch && matchesTags;
    });
  }, [bookmarks, search, selectedTags]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            BookmarkerBuddy
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm sm:text-base">Welcome, {user?.username}</span>
            <Button
  variant="ghost"
  size="icon"
  onClick={() => document.documentElement.classList.toggle('dark')}
  className="h-8 w-8 border-2 border-gray-300 dark:border-gray-600 rounded-full hover:border-primary focus:ring-2 focus:ring-primary transition-all"
>
  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 dark:text-white text-black" />
  <span className="sr-only">Toggle theme</span>
</Button>
        <Button
          variant="outline"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="backdrop-blur-sm bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 border-0 text-black dark:text-white"
        >
          {logoutMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Logout
        </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4 mb-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="backdrop-blur-sm bg-white/10 border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookmarks</CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalBookmarks ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-sm bg-white/10 border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Accessed</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats?.mostAccessed.slice(0, 3).map(bookmark => (
                  <div key={bookmark.id} className="text-sm">
                    <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {bookmark.title}
                    </a>
                    <div className="text-xs text-muted-foreground">
                      {bookmark.accessCount} views
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-sm bg-white/10 border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recently Added</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats?.recentlyCreated.slice(0, 3).map(bookmark => (
                  <div key={bookmark.id} className="text-sm">
                    <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {bookmark.title}
                    </a>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(bookmark.createdAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-sm bg-white/10 border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recently Accessed</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats?.recentlyAccessed.slice(0, 3).map(bookmark => (
                  <div key={bookmark.id} className="text-sm">
                    <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {bookmark.title}
                    </a>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(bookmark.lastAccessedAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="w-full md:w-auto flex-1 space-y-4">
          <div className="relative max-w-full sm:max-w-sm">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
    <Input
      className="pl-10 w-full bg-background/80 border-2 border-primary/30 focus:border-primary hover:border-primary/50 transition-colors shadow-sm text-black dark:text-white"
      placeholder="Search bookmarks..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  </div>
            <div className="flex flex-wrap gap-2 max-w-full overflow-hidden">
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="border-2 cursor-pointer hover:bg-primary/20 text-xs sm:text-sm whitespace-nowrap"
                  onClick={() => {
                    setSelectedTags(prev =>
                      prev.includes(tag)
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    );
                  }}
                >
          
                  {tag}
                </Badge>
              ))}
            </div>
          </div>


          <Dialog open={isDialogOpen} onOpenChange={(open) => {
              if (!open) {
                setEditingBookmark(null);
                setNewBookmark({ url: "", title: "", description: "", tags: [] });
              }
              setIsDialogOpen(open);
            }}>
            
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto backdrop-blur-sm bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Add Bookmark
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[500px] bg-background/95 text-foreground backdrop-blur-xl border-primary/20 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-foreground text-primary">{editingBookmark ? 'Edit Bookmark' : 'Add New Bookmark'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="url" className="text-sm font-medium text-primary">URL</Label>
                    <Input
                      id="url"
                      value={editingBookmark?.url || newBookmark.url}
                      onChange={handleURLChange}
                      // onChange={(e) => editingBookmark
                      //   ? setEditingBookmark({ ...editingBookmark, url: e.target.value })
                      //   : setNewBookmark(prev => ({ ...prev, url: e.target.value }))}
                      required
                      className=" border-2 border-white/20 focus:border-primary/50 hover:border-white/30 transition-colors backdrop-blur-sm bg-white/10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={editingBookmark?.title || newBookmark.title}
                      onChange={handleTitleChange}
                      // onChange={(e) => editingBookmark
                      //   ? setEditingBookmark({ ...editingBookmark, title: e.target.value })
                      //   : setNewBookmark(prev => ({ ...prev, title: e.target.value }))}
                      required
                      className=" border-2 border-white/20 focus:border-primary/50 hover:border-white/30 transition-colors backdrop-blur-sm bg-white/10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editingBookmark?.description || newBookmark.description}
                      onChange={(e) => editingBookmark
                        ? setEditingBookmark({ ...editingBookmark, description: e.target.value })
                        : setNewBookmark(prev => ({ ...prev, description: e.target.value }))}
                        className=" border-2 border-white/20 focus:border-primary/50 hover:border-white/30 transition-colors backdrop-blur-sm bg-white/10"
                    />
                  </div>
                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(editingBookmark?.tags || newBookmark.tags).map((tag, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="cursor-pointer border-2 border-white/20 focus:border-primary/50 hover:border-white/30 transition-colors backdrop-blur-sm bg-white/10"
                          onClick={() => handleTagRemove(i, editingBookmark || newBookmark)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleTagAdd(editingBookmark || newBookmark);
                          }
                        }}
                        className=" border-2 border-white/20 focus:border-primary/50 hover:border-white/30 transition-colors backdrop-blur-sm bg-white/10"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleTagAdd(editingBookmark || newBookmark)}
                        className="border-2"
                      >
                        <Tag className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-primary/90 hover:bg-primary shadow-lg hover:shadow-xl transition-all duration-200 mt-6" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingBookmark ? 'Update' : 'Save'} Bookmark
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading || isStatsLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredBookmarks.map((bookmark) => (
              <Card key={bookmark.id} className="backdrop-blur-sm bg-white/10 border-0 shadow-xl hover:shadow-2xl transition-all overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="line-clamp-1 text-base sm:text-lg">
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-primary truncate block"
                      >
                        {bookmark.title}
                      </a>
                    </CardTitle>
                    <CardDescription className="line-clamp-1 text-xs sm:text-sm">
                      {bookmark.url}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 ml-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(bookmark)}
                      className="h-8 w-8 hover:bg-white/20"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(bookmark.id)}
                      disabled={deleteMutation.isPending}
                      className="h-8 w-8 hover:bg-white/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {bookmark.description && (
                    <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
                      {bookmark.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {bookmark.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="bg-primary/10 text-xs whitespace-nowrap">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}