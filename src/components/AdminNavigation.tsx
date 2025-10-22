import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, FolderOpen, BarChart3, Mail, Camera, Settings } from 'lucide-react';
import { logout } from '../lib/auth';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useEffect, useState } from 'react';
import { getMessages, getUnreadCount } from '../lib/messages';

export function AdminNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  
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
    logout();
    navigate('/admin/login');
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
          
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                View Site
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut size={18} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
