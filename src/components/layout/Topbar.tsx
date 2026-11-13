import * as React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, Moon, Search, Sun, LogOut, User as UserIcon, Settings as SettingsIcon, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';
import { useBusinessStore } from '@/stores/business-store';
import { notificationService } from '@/lib/services';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatRelative } from '@/lib/format';
import { toast } from '@/components/ui/toast';
import type { AppNotification } from '@/lib/types';

const routeNames: Record<string, string> = {
  dashboard: 'Dashboard',
  products: 'Products',
  inventory: 'Inventory',
  pos: 'Point of Sale',
  sales: 'Sales',
  purchases: 'Purchases',
  expenses: 'Expenses',
  customers: 'Customers',
  suppliers: 'Suppliers',
  reports: 'Reports',
  staff: 'Staff',
  branches: 'Branches',
  settings: 'Settings',
  subscription: 'Subscription',
  support: 'Help & Support',
  onboarding: 'Onboarding',
};

export function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleTheme, theme, setMobileNavOpen } = useUiStore();
  const { user, logout } = useAuthStore();
  const { activeBusiness } = useBusinessStore();

  const breadcrumbs = React.useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    return segments.map((seg, i) => ({
      label: routeNames[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
      to: '/' + segments.slice(0, i + 1).join('/'),
    }));
  }, [location.pathname]);

  const [search, setSearch] = React.useState('');
  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-sm md:flex">
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={crumb.to}>
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            <Link
              to={crumb.to}
              className={cn(
                i === breadcrumbs.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {crumb.label}
            </Link>
          </React.Fragment>
        ))}
      </nav>

      {activeBusiness && (
        <span className="hidden text-xs text-muted-foreground lg:inline">
          · {activeBusiness.name}
        </span>
      )}

      {/* Search */}
      <form onSubmit={onSearch} className="ml-auto hidden w-full max-w-xs sm:block">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="h-9 pl-9"
          />
        </div>
      </form>

      <div className="flex items-center gap-1 sm:ml-auto sm:gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>

        <NotificationsBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-muted">
              <Avatar src={user?.avatarUrl} name={user?.fullName} size="sm" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-foreground">{user?.fullName ?? 'User'}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email ?? user?.phone}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <UserIcon className="h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <SettingsIcon className="h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => { logout(); navigate('/login'); }}>
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function NotificationsBell() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.list,
  });
  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  const markAll = useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-semibold">Notifications</span>
          {unread > 0 && (
            <button className="text-xs text-accent hover:underline" onClick={() => markAll.mutate()}>
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto scrollbar-thin">
          {isLoading ? (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">Loading...</p>
          ) : notifications && notifications.length > 0 ? (
            notifications.map((n: AppNotification) => (
              <div key={n.id} className={cn('flex gap-3 px-2 py-2.5', !n.read && 'bg-accent/5')}>
                <div className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-accent')} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{formatRelative(n.createdAt)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">No notifications</p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

