import { Sparkles, Instagram, Github } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-muted/50 border-t border-border py-8 dark:bg-sidebar/80 dark:border-sidebar">
      <div className="container">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* 왼쪽: 로고와 저작권 */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <Sparkles className="h-5 w-5 text-primary animate-sparkle" />
              <span className="font-cute text-xl text-foreground group-hover:text-primary transition-colors dark:text-sidebar-foreground">
                Timeline
              </span>
            </Link>
            <p className="text-sm text-muted-foreground dark:text-sidebar-foreground">
              © {new Date().getFullYear()} Timeline. All rights reserved.
            </p>
          </div>

          {/* 오른쪽: 소셜 미디어 아이콘 */}
          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 w-10 rounded-full bg-card flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors dark:bg-sidebar"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 w-10 rounded-full bg-card flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors dark:bg-sidebar"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
