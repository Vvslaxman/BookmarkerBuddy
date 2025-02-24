
import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "@/contexts/theme-context";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
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

  );
}
