import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Settings as SettingsIcon, Package, BarChart, FileText, Receipt, BarChart3, Truck, Shield, Globe, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminPanelButton } from '@/components/AdminPanelButton';
import { LanguageSelector } from '@/components/LanguageSelector';
import { BluetoothDevicesSettings } from '@/components/BluetoothDevicesSettings';
import { DistributorSettings } from '@/components/DistributorSettings';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';

const Settings = () => {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  const navigationOptions = [
    { name: 'dashboard', href: '/', icon: BarChart3, description: 'View business overview and analytics' },
    { name: 'parties', href: '/suppliers', icon: Truck, description: 'Manage suppliers and customers' },
    { name: 'products', href: '/products', icon: Package, description: 'Manage your product catalog' },
    { name: 'inventory', href: '/inventory', icon: BarChart, description: 'Track stock and inventory levels' },
    { name: 'createInvoice', href: '/create-invoice', icon: FileText, description: 'Create new bills and invoices' },
    { name: 'invoices', href: '/invoices', icon: Receipt, description: 'View and manage all invoices' },
    { name: 'reports', href: '/reports', icon: BarChart3, description: 'Generate business reports' },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 glass-card bg-primary-glass">
            <SettingsIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('settings')}</h1>
            <p className="text-muted-foreground mt-2">{t('manageYourApplicationSettings')}</p>
          </div>
        </div>
      </div>

      {/* Navigation Options */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">{t('quickNavigation')}</CardTitle>
          <p className="text-muted-foreground text-sm">{t('accessDifferentSections')}</p>
        </CardHeader>
        <CardContent>
          <div className="mobile-grid">
            {navigationOptions.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} to={item.href}>
                  <Card className="glass-card hover:bg-accent/50 transition-all duration-200 cursor-pointer border-2 hover:border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-card-foreground">{t(item.name)}</h3>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Application Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Admin Panel */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('adminPanel')}
            </CardTitle>
            <p className="text-muted-foreground text-sm">{t('accessAdministrativeFunctions')}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('manageUsersRolesDepartments')}
              </p>
              <AdminPanelButton />
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('languageAndLocalization')}
            </CardTitle>
            <p className="text-muted-foreground text-sm">{t('changeApplicationLanguage')}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('selectPreferredLanguage')}
              </p>
              <LanguageSelector />
            </div>
          </CardContent>
        </Card>

        {/* Distributor Settings */}
        <DistributorSettings />

        {/* Bluetooth Printer Settings */}
        <BluetoothDevicesSettings />

        {/* Account Actions */}
        <Card className="glass-card border-destructive/20">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <LogOut className="h-5 w-5 text-destructive" />
              Account Actions
            </CardTitle>
            <p className="text-muted-foreground text-sm">Manage your account and session</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sign out of your account to end your current session
              </p>
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-full sm:w-auto"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;