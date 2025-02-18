import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Search, Trash2, Tag, Edit2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Bookmark } from "@shared/schema";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBookmark) {
      updateMutation.mutate(editingBookmark);
    } else {
      createMutation.mutate(newBookmark);
    }
  };

  const filteredBookmarks = bookmarks?.filter(bookmark => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      bookmark.title.toLowerCase().includes(searchLower) ||
      bookmark.description?.toLowerCase().includes(searchLower) ||
      bookmark.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Bookmarker</h1>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">Welcome, {user?.username}</span>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              className="pl-10"
              placeholder="Search bookmarks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) {
              setEditingBookmark(null);
              setNewBookmark({ url: "", title: "", description: "", tags: [] });
            }
            setIsDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Bookmark
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBookmark ? 'Edit Bookmark' : 'Add New Bookmark'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="url">URL</Label>
                    <Input
                      id="url"
                      value={editingBookmark?.url || newBookmark.url}
                      onChange={(e) => editingBookmark 
                        ? setEditingBookmark({ ...editingBookmark, url: e.target.value })
                        : setNewBookmark(prev => ({ ...prev, url: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={editingBookmark?.title || newBookmark.title}
                      onChange={(e) => editingBookmark
                        ? setEditingBookmark({ ...editingBookmark, title: e.target.value })
                        : setNewBookmark(prev => ({ ...prev, title: e.target.value }))}
                      required
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
                    />
                  </div>
                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(editingBookmark?.tags || newBookmark.tags).map((tag, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="cursor-pointer"
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
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleTagAdd(editingBookmark || newBookmark)}
                      >
                        <Tag className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingBookmark ? 'Update' : 'Save'} Bookmark
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBookmarks?.map((bookmark) => (
              <Card key={bookmark.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="line-clamp-1">
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {bookmark.title}
                      </a>
                    </CardTitle>
                    <CardDescription className="line-clamp-1">
                      {bookmark.url}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(bookmark)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(bookmark.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {bookmark.description && (
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {bookmark.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {bookmark.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary">
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