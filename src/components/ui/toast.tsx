import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';

export { sonnerToast as toast };

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'rounded-lg border border-border bg-card text-card-foreground shadow-lg',
          title: 'font-medium',
        },
      }}
    />
  );
}
