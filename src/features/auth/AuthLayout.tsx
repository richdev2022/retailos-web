import * as React from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useUiStore } from '@/stores/ui-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  footer?: React.ReactNode;
}

export function AuthLayout({ children, title, description, footer }: AuthLayoutProps) {
  const { theme, toggleTheme } = useUiStore();
  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-sidebar p-12 lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent font-heading text-xl font-bold text-accent-foreground">
            R
          </div>
          <span className="font-heading text-xl font-bold text-sidebar-foreground">RetailOS</span>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="font-heading text-4xl font-bold leading-tight text-sidebar-foreground text-balance">
            Run your retail business like a pro.
          </h1>
          <p className="max-w-md text-base text-sidebar-foreground/70">
            Inventory, POS, sales, expenses, reports and more — all in one place.
            Built for African merchants, trusted by growing stores.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: 'Sales tracked', value: '\u20A6420M+' },
              { label: 'Active stores', value: '1,200+' },
              { label: 'Products managed', value: '850K+' },
              { label: 'Uptime', value: '99.9%' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg bg-sidebar-accent/50 p-4">
                <p className="font-heading text-2xl font-bold text-accent">{stat.value}</p>
                <p className="text-xs text-sidebar-foreground/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-xs text-sidebar-foreground/50">
          {'\u00A9'} {new Date().getFullYear()} RetailOS. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="relative flex w-full flex-col bg-background lg:w-1/2">
        <div className="flex items-center justify-between p-6">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent font-heading text-base font-bold text-accent-foreground">
              R
            </div>
            <span className="font-heading text-lg font-bold">RetailOS</span>
          </Link>
          <Button variant="ghost" size="icon" className="ml-auto" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className={cn('w-full max-w-md space-y-6 animate-fade-in')}>
            <div className="space-y-2 text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight">{title}</h2>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            {children}
            {footer && <div className="text-center text-sm text-muted-foreground">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
