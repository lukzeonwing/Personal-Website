import { Link } from 'react-router-dom';

interface BrandLogoProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function BrandLogo({ variant = 'default', className = '' }: BrandLogoProps) {
  const imageSize = variant === 'compact' ? 'h-9' : 'h-10';
  const textSize = variant === 'compact' ? 'text-lg' : 'text-xl';

  return (
    <Link to="/" className={`flex items-center gap-3 ${className}`}>
      <img
        src={import.meta.env.BASE_URL + 'brand/logo.svg'}
        alt="Brand logo"
        className={`${imageSize} w-auto`}
      />
      <span className={`${textSize} font-medium tracking-tight text-primary-foreground`}>Jarvis Studio</span>
    </Link>
  );
}
