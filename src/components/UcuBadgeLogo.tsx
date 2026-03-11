import { useState } from 'react';
import { cn } from './ui/utils';

type UcuBadgeLogoProps = {
  className?: string;
  imageClassName?: string;
  fallbackTextClassName?: string;
  linkHref?: string;
};

export function UcuBadgeLogo({
  className,
  imageClassName,
  fallbackTextClassName,
  linkHref,
}: UcuBadgeLogoProps) {
  const logoSources = [
    '/ucu-logo.jpg',
    'https://upload.wikimedia.org/wikipedia/en/5/5d/Uganda_Christian_University_logo.jpg',
  ];
  const [sourceIndex, setSourceIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const logoContent = (
    <div className={cn('h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border/70 bg-card/60 p-0.5 flex items-center justify-center', className)}>
      {!imageError ? (
        <img
          src={logoSources[sourceIndex]}
          alt="Uganda Christian University badge"
          className={cn('h-full w-full object-contain', imageClassName)}
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

  if (linkHref) {
    return (
      <a href={linkHref} target="_blank" rel="noopener noreferrer" aria-label="Open Uganda Christian University page">
        {logoContent}
      </a>
    );
  }

  return logoContent;
}

