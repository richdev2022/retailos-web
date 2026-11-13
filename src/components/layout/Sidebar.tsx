import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronsUpDown,
  PanelLeftClose,
  PanelLeft,
  Plus,
  Check,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusinessStore } from '@/stores/business-store';
import { useUiStore } from '@/stores/ui-store';
import { businessService } from '@/lib/services';
import { useBusinesses } from '@/hooks/use-active-business';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { navSections, supportItem } from './nav';

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, setMobileNavOpen } = useUiStore();
  const { activeBusiness, setActiveBusiness } = useBusinessStore();
  const { data: businesses, isLoading } = useBusinesses();
  const [creating, setCreating] = React.useState(false);

  const onActivate = async (id: string) => {
    try {
      await businessService.activate(id);
      setActiveBusiness(id);
    } catch {
      setActiveBusiness(id);
    }
  };

  return (
    <aside
      className={cn(
        'flex h-full flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200',
        sidebarCollapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-4">
        <Link to="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent font-heading text-lg font-bold text-accent-foreground">
            R
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="font-heading text-base font-bold leading-tight text-sidebar-foreground">RetailOS</p>
              <p className="text-[10px] uppercase tracking-wide text-sidebar-foreground/50">Retail Platform</p>
            </div>
          )}
        </Link>
      </div>

      {/* Business selector */}
      <div className="border-b border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex w-full items-center gap-2 rounded-lg bg-sidebar-accent/60 p-2 text-left transition-colors hover:bg-sidebar-accent',
                sidebarCollapsed && 'justify-center',
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/20 text-accent">
                <Store className="h-4 w-4" />
              </div>
              {!sidebarCollapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    {isLoading ? (
                      <Skeleton className="h-3 w-24 bg-sidebar-foreground/10" />
                    ) : (
                      <p className="truncate text-sm font-medium text-sidebar-foreground">
                        {activeBusiness?.name ?? 'Select business'}
                      </p>
                    )}
                    <p className="truncate text-[10px] text-sidebar-foreground/50">
                      {activeBusiness?.category ?? 'Switch business'}
                    </p>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 text-sidebar-foreground/50" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Your businesses</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {businesses?.map((b) => (
              <DropdownMenuItem key={b.id} onClick={() => onActivate(b.id)} className="flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 truncate">{b.name}</span>
                {activeBusiness?.id === b.id && <Check className="h-4 w-4 text-accent" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setCreating(true)} className="text-accent">
              <Plus className="h-4 w-4" /> New business
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-5 overflow-y-auto scrollbar-thin px-3 py-4">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!sidebarCollapsed && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn('sidebar-link', active && 'sidebar-link-active', sidebarCollapsed && 'justify-center px-2')}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
        <div className="space-y-1">
          <Link
            to={supportItem.to}
            onClick={() => setMobileNavOpen(false)}
            className={cn('sidebar-link', (location.pathname === supportItem.to) && 'sidebar-link-active', sidebarCollapsed && 'justify-center px-2')}
            title={sidebarCollapsed ? supportItem.label : undefined}
          >
            <supportItem.icon className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">{supportItem.label}</span>}
          </Link>
        </div>
      </nav>

      {/* Collapse toggle */}
      <div className="hidden border-t border-sidebar-border p-3 lg:block">
        <Button variant="ghost" size="sm" onClick={toggleSidebar} className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!sidebarCollapsed && <span>Collapse</span>}
        </Button>
      </div>

      {creating && <CreateBusinessRedirect />}
    </aside>
  );
}

function CreateBusinessRedirect() {
  React.useEffect(() => {
    window.location.href = '/onboarding/business';
  }, []);
  return null;
}
