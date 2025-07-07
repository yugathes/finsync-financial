import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Users, Settings, Menu, LogOut } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero shadow-elevation sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
              <h1 className="text-2xl font-bold text-white">{title}</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <Users className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <Settings className="h-5 w-5" />
              </Button>
              {session && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {showHero && (
        <section className="relative">
          <div 
            className="h-64 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-primary/20"></div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};