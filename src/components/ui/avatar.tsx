import * as React from 'react';
import { cn, initials } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ className, src, name, size = 'md', ...props }, ref) => {
    const [errored, setErrored] = React.useState(false);
    return (
      <span
        ref={ref}
        className={cn(
          'relative inline-flex shrink-0 overflow-hidden rounded-full bg-accent/15 text-accent font-semibold ring-1 ring-border',
          sizeMap[size],
          className,
        )}
        {...props}
      >
        {src && !errored ? (
          <img src={src} alt={name ?? 'avatar'} className="h-full w-full object-cover" onError={() => setErrored(true)} />
        ) : (
          <span className="flex h-full w-full items-center justify-center">{initials(name)}</span>
        )}
      </span>
    );
  },
);
Avatar.displayName = 'Avatar';
