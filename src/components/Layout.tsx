import { ReactNode } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Users, Truck, Package, FileText, ShoppingCart, Receipt, BarChart3, CreditCard, Calculator, BarChart, Menu, X, Building2, LogOut, User, RotateCcw, Shield, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LanguageSelector } from '@/components/LanguageSelector';
import { AdminPanelButton } from '@/components/AdminPanelButton';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: ReactNode;
}

const allNavigation = [{
  name: 'dashboard',
  href: '/',
  icon: BarChart3
}, {
  name: 'parties',
  href: '/parties',
  icon: Truck
}, {
  name: 'products',
  href: '/products',
  icon: Package
}, {
  name: 'inventory',
  href: '/inventory',
  icon: BarChart,
  adminOnly: true
}, {
  name: 'operations',
  href: '/operations',
  icon: Settings,
  superAdminOnly: true
}, {
  name: 'packaging',
  href: '/packaging',
  icon: Package,
  superAdminOnly: true
}, {
  name: 'createInvoice',
  href: '/create-invoice',
  icon: FileText
}, {
  name: 'invoices',
  href: '/invoices',
  icon: Receipt
}, {
  name: 'returns',
  href: '/returns',
  icon: RotateCcw
}, {
  name: 'distributorsData',
  href: '/distributors-data',
  icon: Users,
  superAdminOnly: true
}, {
  name: 'settings',
  href: '/settings',
  icon: Building2
}];

export function Layout({
  children
}: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    user,
    loading,
    signOut
  } = useAuth();
  const {
    userRole,
    isAdmin,
    isDistributor,
    isSuperAdmin,
    hasAccessToPage,
    loading: roleLoading
  } = useUserRole();
  const {
    t
  } = useTranslation();

  // Clean loading state - wait for both auth and role to load
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass-card p-8 text-center max-w-sm w-full mx-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user has access to current page (superadmin always allowed)
  console.log('[Layout] Access check:', { 
    pathname: location.pathname, 
    isSuperAdmin: isSuperAdmin(), 
    hasAccess: hasAccessToPage(location.pathname),
    userRole,
    userEmail: user?.email
  });
  
  if (!isSuperAdmin() && !hasAccessToPage(location.pathname)) {
    console.log('[Layout] REDIRECTING to dashboard - access denied');
    return <Navigate to="/" replace />;
  }

  // Filter navigation based on user role
  const navigation = allNavigation.filter(item => {
    if (item.adminOnly) {
      return isSuperAdmin() || isAdmin();
    }
    if (item.superAdminOnly) {
      return isSuperAdmin();
    }
    return true;
  });

  const handleSignOut = async (e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setSidebarOpen(false);
    await signOut();
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
    }
    return user?.email || 'User';
  };

  const getRoleColor = () => {
    if (isSuperAdmin()) return 'bg-red-500/90';
    if (isAdmin()) return 'bg-primary';
    if (isDistributor()) return 'bg-accent';
    return 'bg-muted-foreground';
  };

  const getRoleName = () => {
    if (isSuperAdmin()) return 'Super Admin';
    if (isAdmin()) return 'Admin';
    if (isDistributor()) return 'Distributor';
    return userRole || 'User';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden transition-opacity duration-200" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Clean Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'glass-sidebar border-r border-border/50'
      )}>
        {/* Simple Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-border/30">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Shree Ganesh</h1>
              <p className="text-xs text-muted-foreground">Gruh Udhyog</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden h-8 w-8" 
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Clean Navigation */}
        <nav className="mt-6 px-4">
          <ul className="space-y-1">
            {navigation.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                      isActive 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className={cn(
                      "h-4 w-4 transition-colors duration-150",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    <span>{t(item.name)}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Clean Header */}
        <header className="glass-nav sticky top-0 z-30 h-16 border-b border-border/30">
          <div className="flex h-full items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden h-8 w-8" 
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              
              <div className="hidden md:block">
                <h2 className="text-lg font-semibold text-foreground capitalize">
                  {t(navigation.find(item => item.href === location.pathname)?.name || 'dashboard')}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { 
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
              
              {/* Clean User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-auto p-2 hover:bg-muted/40 rounded-lg transition-colors duration-150">
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:block text-left">
                        <div className="text-sm font-medium text-foreground">
                          {getUserDisplayName()}
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={cn("text-xs text-white border-0", getRoleColor())}
                        >
                          {getRoleName()}
                        </Badge>
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end" className="glass-card w-48">
                  <div className="px-3 py-2 border-b border-border/30">
                    <p className="text-sm font-medium text-foreground">{getUserDisplayName()}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  
                  <DropdownMenuItem className="cursor-pointer hover:bg-muted/40 transition-colors duration-150">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  
                  {(isSuperAdmin() || isAdmin()) && (
                    <DropdownMenuItem asChild className="cursor-pointer hover:bg-muted/40 transition-colors duration-150">
                      <Link to="/admin-panel" className="w-full flex items-center">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  {isSuperAdmin() && (
                    <DropdownMenuItem asChild className="cursor-pointer hover:bg-muted/40 transition-colors duration-150">
                      <Link to="/distributors-data" className="w-full flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        Distributors Data
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem asChild className="cursor-pointer hover:bg-muted/40 transition-colors duration-150">
                    <Link to="/settings" className="w-full flex items-center">
                      <Building2 className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  
                  <div className="border-t border-border/30 my-1"></div>
                  
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    onTouchEnd={handleSignOut}
                    className="cursor-pointer text-destructive hover:bg-destructive/10 transition-colors duration-150 active:bg-destructive/20"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}