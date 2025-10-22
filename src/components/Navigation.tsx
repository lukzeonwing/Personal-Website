import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navigation() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (shouldCloseMenu = false) => () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (shouldCloseMenu) {
      setMobileMenuOpen(false);
    }
  };
  
  const links = [
    { to: '/', label: 'Home' },
    { to: '/projects', label: 'Projects' },
    { to: '/stories', label: 'Stories' },
    { to: '/workshop', label: 'Workshop' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="sticky top-0 z-50 bg-primary border-b border-primary-foreground/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-semibold tracking-tight text-primary-foreground">
            JARVIS LU
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={handleLinkClick()}
                className={`transition-colors ${
                  isActive(link.to)
                    ? 'text-primary-foreground'
                    : 'text-primary-foreground/60 hover:text-primary-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-primary-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-primary-foreground/10">
            <div className="flex flex-col gap-4">
              {links.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={handleLinkClick(true)}
                  className={`transition-colors ${
                    isActive(link.to)
                      ? 'text-primary-foreground'
                      : 'text-primary-foreground/60 hover:text-primary-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
