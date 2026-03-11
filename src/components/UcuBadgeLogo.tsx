import { useState } from 'react';
import { cn } from './ui/utils';

type UcuBadgeLogoProps = {
  className?: string;
  imageClassName?: string;
  fallbackTextClassName?: string;
};

export function UcuBadgeLogo({
  className,
  imageClassName,
  fallbackTextClassName,
}: UcuBadgeLogoProps) {
  const logoSources = ['/ucu-logo.png', '/images.png'];
  const [sourceIndex, setSourceIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  return (
    <div className={cn('overflow-hidden rounded-full border border-border bg-card flex items-center justify-center', className)}>
      {!imageError ? (
        <img
          src='https://en.wikipedia.org/wiki/Uganda_Christian_University'
          alt="Uganda Christian University badge"
          className={cn('h-full w-full object-cover', imageClassName)}
          onError={() => {
            if (sourceIndex < logoSources.length - 1) {
              setSourceIndex((prev) => prev + 1);
              return;
            }
            setImageError(true);
          }}
        />
      ) : (
        <span className={cn('text-xs font-semibold text-primary', fallbackTextClassName)}>UCU</span>
      )}
    </div>
  );
}

