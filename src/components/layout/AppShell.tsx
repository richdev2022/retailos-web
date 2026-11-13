import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useUiStore } from '@/stores/ui-store';

export function AppShell() {
  const { mobileNavOpen, setMobileNavOpen } = useUiStore();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar (sheet) */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen} side="left">
        <SheetContent showClose={false} className="w-64 p-0">
          <div className="h-full">
            <Sidebar />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className={cn('flex-1 overflow-y-auto scrollbar-thin')}>
          <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
