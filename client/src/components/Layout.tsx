import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Users, Settings, Menu, LogOut, Home } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/financial-hero.jpg";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showHero?: boolean;
}

export const Layout = ({ children, title = "FinSync", showHero = false }: LayoutProps) => {
  const { session, signOut } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="bg-gradient-hero shadow-elevation sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 md:hidden flex-shrink-0 touch-target">
                <Menu className="h-6 w-6" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{title}</h1>
            </div>

            <nav className="flex items-center gap-1 sm:gap-2 flex-shrink-0" aria-label="Main navigation">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 touch-target"
                onClick={() => navigate('/dashboard')}
                title="Home"
                aria-label="Go to dashboard"
              >
                <Home className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 touch-target"
                onClick={() => navigate('/groups')}
                title="Groups"
                aria-label="Go to groups"
              >
                <Users className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 touch-target" aria-label="Settings">
                <Settings className="h-5 w-5" />
              </Button>
              {session && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 touch-target"
                  onClick={handleLogout}
                  aria-label="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {showHero && (
        <section className="relative">
          <div
            className="h-40 sm:h-64 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-primary/20"></div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {children}
      </main>
    </div>
  );
};
