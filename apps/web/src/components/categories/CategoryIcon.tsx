import React from 'react';
import * as Icons from 'lucide-react';

interface CategoryIconProps {
  name: string | null | undefined;
  className?: string;
  size?: number;
}

export function CategoryIcon({
  name,
  className = 'h-5 w-5',
  size,
}: CategoryIconProps) {
  if (!name) {
    return <Icons.Tag className={className} size={size} />;
  }

  // Look up icon in lucide-react exports
  const IconComponent = (Icons as Record<string, any>)[name];

  if (IconComponent && typeof IconComponent === 'object') {
    return <IconComponent className={className} size={size} />;
  }

  // Fallback to Tag icon
  return <Icons.Tag className={className} size={size} />;
}
