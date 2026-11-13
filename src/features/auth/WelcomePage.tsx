import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, CreditCard, Package, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/stores/ui-store';
import { Moon, Sun } from 'lucide-react';

const features = [
  { icon: ShoppingCart, title: 'Fast POS', desc: 'Ring up sales in seconds with barcode & cart support.' },
  { icon: Package, title: 'Smart Inventory', desc: 'Track stock, batches, and get low-stock alerts.' },
  { icon: BarChart3, title: 'Real-time Reports', desc: 'Sales, profit/loss, and inventory valuation.' },
  { icon: CreditCard, title: 'Multi-business', desc: 'Manage unlimited stores from one dashboard.' },
];

export default function WelcomePage() {
  const { theme, toggleTheme } = useUiStore();
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-12">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar font-heading text-xl font-bold text-accent">
            R
          </div>
          <span className="font-heading text-xl font-bold">RetailOS</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button variant="accent" asChild>
            <Link to="/register">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 pb-20 pt-12 sm:px-12 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            Built for African merchants
          </span>
          <h1 className="mt-6 font-heading text-5xl font-bold tracking-tight text-balance sm:text-6xl">
            The all-in-one platform for <span className="text-accent">modern retail</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground text-balance">
            Manage inventory, process sales, track expenses, and grow your business with
            powerful insights — from any device, online or offline.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="xl" variant="accent" asChild>
              <Link to="/register">
                Start free trial <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">No credit card required · 14-day trial</p>
        </div>

        <div className="mt-20 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-base font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
