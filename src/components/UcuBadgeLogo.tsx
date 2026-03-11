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
  const [imageError, setImageError] = useState(false);

  return (
    <div className={cn('overflow-hidden rounded-full border border-border bg-card flex items-center justify-center', className)}>
      {!imageError ? (
        <img
          src="/images.png"
          alt="Uganda Christian University badge"
          className={cn('h-full w-full object-cover', imageClassName)}
          onError={() => setImageError(true)}
        />
      ) : (
        <span className={cn('text-xs font-semibold text-primary', fallbackTextClassName)}>UCU</span>
      )}
    </div>
  );
}

