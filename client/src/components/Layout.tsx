import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Home,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  ReceiptText,
  Settings,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import heroImage from '@/assets/financial-hero.jpg';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showHero?: boolean;
}

export const Layout = ({ children, title = 'FinSync', showHero = false }: LayoutProps) => {
  const { session, signOut, user } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const isDashboard = location.pathname === '/dashboard';

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const openQuickAdd = (action: 'commitment' | 'expense' | 'income') => {
    setQuickAddOpen(false);
    navigate('/dashboard');
    window.setTimeout(() => window.dispatchEvent(new CustomEvent('finsync:quick-add', { detail: action })), 0);
  };

  const navigateTo = (path: string) => {
    setMoreOpen(false);
    navigate(path);
  };

  const navigateToCommitments = () => {
    navigate('/dashboard#commitments');
    window.setTimeout(
      () => document.getElementById('commitments')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      0
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      {/* Header */}
      <header className="bg-white/95 border-b border-blue-100 shadow-sm sticky top-0 z-50 backdrop-blur md:bg-gradient-hero md:border-0 md:shadow-elevation">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-primary hover:bg-blue-50 md:hidden"
                onClick={() => setMoreOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
              <div>
                <p className="text-sm font-bold text-primary md:text-white">FinSync</p>
                <h1 className="hidden text-xl font-semibold text-white md:block">{title.replace('FinSync - ', '')}</h1>
              </div>
            </div>

            <div className="hidden items-center space-x-2 md:flex">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => navigate('/dashboard')}
                title="Home"
                aria-label="Go to dashboard"
              >
                <Home className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => navigate('/groups')}
                title="Groups"
                aria-label="Go to groups"
              >
                <Users className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 touch-target"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
              {session && (
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary hover:bg-blue-50 md:hidden"
              onClick={() => setMoreOpen(true)}
              aria-label="Open account menu"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {showHero && (
        <section className="relative">
          <div className="h-64 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroImage})` }}>
            <div className="absolute inset-0 bg-gradient-primary/20"></div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">{children}</main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-blue-100 bg-white/95 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(30,64,175,0.08)] backdrop-blur md:hidden"
        aria-label="Primary navigation"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 items-end">
          <MobileNavButton
            active={isDashboard && !location.hash}
            icon={<Home />}
            label="Home"
            onClick={() => navigate('/dashboard')}
          />
          <MobileNavButton
            active={isDashboard && location.hash === '#commitments'}
            icon={<CalendarDays />}
            label="Commitments"
            onClick={navigateToCommitments}
          />
          <button
            className="-mt-8 flex flex-col items-center gap-1 text-xs font-medium text-primary"
            onClick={() => setQuickAddOpen(true)}
            aria-label="Quick add"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-[0_8px_20px_rgba(5,150,105,0.35)]">
              <Plus className="h-6 w-6" />
            </span>
            Add
          </button>
          <MobileNavButton
            active={location.pathname === '/categories'}
            icon={<BarChart3 />}
            label="Categories"
            onClick={() => navigate('/categories')}
          />
          <MobileNavButton
            active={location.pathname === '/groups'}
            icon={<MoreHorizontal />}
            label="More"
            onClick={() => setMoreOpen(true)}
          />
        </div>
      </nav>

      <Sheet open={quickAddOpen} onOpenChange={setQuickAddOpen}>
        <SheetContent side="bottom" className="rounded-t-xl border-blue-100 px-5 pb-8 pt-8 sm:mx-auto sm:max-w-md">
          <SheetHeader className="mb-5 text-left">
            <SheetTitle>Quick Add</SheetTitle>
            <SheetDescription>Choose what you want to add.</SheetDescription>
          </SheetHeader>
          <div className="space-y-3">
            <QuickAddButton
              icon={<CalendarDays />}
              label="Commitment"
              detail="Monthly bill, subscription, or fixed payment"
              onClick={() => openQuickAdd('commitment')}
            />
            <QuickAddButton
              icon={<CircleDollarSign />}
              label="Income"
              detail="Salary, bonus, or other monthly income"
              onClick={() => openQuickAdd('income')}
            />
            <QuickAddButton
              icon={<ReceiptText />}
              label="Expense"
              detail="Variable monthly expense"
              onClick={() => openQuickAdd('expense')}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="right" className="w-[88vw] border-0 bg-[#10294a] p-5 text-white sm:max-w-sm">
          <SheetHeader className="mb-8 pr-10 text-left">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400 text-lg font-bold text-emerald-950">
              {user?.email?.slice(0, 1).toUpperCase() ?? 'F'}
            </div>
            <SheetTitle className="text-white">{user?.user_metadata?.full_name ?? 'Your FinSync'}</SheetTitle>
            <SheetDescription className="truncate text-blue-200">
              {user?.email ?? 'Manage your account'}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-1">
            <MoreMenuButton
              icon={<Home />}
              label="Dashboard"
              active={isDashboard}
              onClick={() => navigateTo('/dashboard')}
            />
            <MoreMenuButton
              icon={<Users />}
              label="Groups"
              active={location.pathname === '/groups'}
              onClick={() => navigateTo('/groups')}
            />
            <MoreMenuButton icon={<BarChart3 />} label="Reports" disabled />
            <MoreMenuButton
              icon={<WalletCards />}
              label="Categories"
              active={location.pathname === '/categories'}
              onClick={() => navigateTo('/categories')}
            />
            <MoreMenuButton icon={<Settings />} label="Settings" disabled />
          </div>
          <div className="absolute inset-x-5 bottom-7 border-t border-blue-400/20 pt-5">
            <button
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-blue-100 hover:bg-white/10"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

const MobileNavButton = ({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    className={`flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium ${active ? 'text-primary' : 'text-slate-500'}`}
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
  >
    <span className="h-5 w-5">{icon}</span>
    {label}
  </button>
);

const QuickAddButton = ({
  icon,
  label,
  detail,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  detail: string;
  onClick: () => void;
}) => (
  <button
    className="flex w-full items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-left hover:border-blue-200 hover:bg-blue-50"
    onClick={onClick}
  >
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
      {icon}
    </span>
    <span>
      <span className="block font-semibold text-slate-800">{label}</span>
      <span className="block text-xs text-slate-500">{detail}</span>
    </span>
  </button>
);

const MoreMenuButton = ({
  icon,
  label,
  active,
  onClick,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <button
    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm ${active ? 'bg-blue-500/40 text-white' : disabled ? 'cursor-not-allowed text-blue-300/50' : 'text-blue-100 hover:bg-white/10'}`}
    onClick={onClick}
    disabled={disabled}
  >
    <span className="h-5 w-5">{icon}</span>
    {label}
    {disabled && <span className="ml-auto text-[10px] uppercase tracking-wide">Soon</span>}
  </button>
);
