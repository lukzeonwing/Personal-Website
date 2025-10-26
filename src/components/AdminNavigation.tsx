import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, FolderOpen, BarChart3, Mail, Camera, Settings, Menu, X } from 'lucide-react';
import { logout } from '../lib/auth';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useEffect, useState } from 'react';
import { getMessages, getUnreadCount } from '../lib/messages';

export function AdminNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const updateUnreadCount = async () => {
      try {
        const messages = await getMessages();
        setUnreadCount(getUnreadCount(messages));
      } catch (error) {
        console.error('Failed to fetch unread message count', error);
        setUnreadCount(0);
      }
    };

    void updateUnreadCount();

    // Update count every 5 seconds when on admin pages
    const interval = setInterval(() => {
      void updateUnreadCount();
    }, 5000);

    return () => clearInterval(interval);
  }, [location.pathname]);
  
  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate('/');
  };
  
  const links = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/projects', label: 'Projects', icon: FolderOpen },
    { to: '/admin/stories', label: 'Stories', icon: Camera },
    { to: '/admin/messages', label: 'Messages', icon: Mail, badge: unreadCount },
    { to: '/admin/statistics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/site-content', label: 'Site Content', icon: Settings },
  ];
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="border-b border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/admin">
              Admin Panel
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              {links.map(link => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-2 transition-colors relative ${
                      isActive(link.to)
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon size={18} />
                    {link.label}
                    {link.badge !== undefined && link.badge > 0 && (
                      <Badge variant="default" className="ml-1 h-5 min-w-5 px-1 text-xs">
                        {link.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut size={18} className="mr-2" />
              Logout
            </Button>
          </div>

          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-2 text-muted-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              {links.map(link => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors ${
                      isActive(link.to)
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={18} />
                      {link.label}
                    </div>
                    {link.badge !== undefined && link.badge > 0 && (
                      <Badge variant="default" className="h-5 min-w-5 px-1 text-xs">
                        {link.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
              <Button variant="ghost" size="sm" className="justify-start mt-2" onClick={handleLogout}>
                <LogOut size={18} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
