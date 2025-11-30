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
    { name: 'dashboard', href: '/', icon: BarChart3, description: 'viewBusinessOverview' },
    { name: 'parties', href: '/suppliers', icon: Truck, description: 'manageSuppliersAndCustomers' },
    { name: 'products', href: '/products', icon: Package, description: 'manageYourProductCatalog' },
    { name: 'inventory', href: '/inventory', icon: BarChart, description: 'trackStockAndInventoryLevels' },
    { name: 'createInvoice', href: '/create-invoice', icon: FileText, description: 'createNewBillsAndInvoices' },
    { name: 'invoices', href: '/invoices', icon: Receipt, description: 'viewAndManageAllInvoices' },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <SettingsIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('settings')}</h1>
          <p className="text-sm text-muted-foreground">{t('manageYourApplicationSettings')}</p>
        </div>
      </div>

      {/* Navigation Options */}
      <Card className="border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-card-foreground">{t('quickNavigation')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {navigationOptions.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} to={item.href}>
                  <Card className="hover:bg-accent/50 transition-all duration-200 cursor-pointer border hover:border-primary/20">
                    <CardContent className="p-3">
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-xs font-medium text-card-foreground">{t(item.name)}</h3>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Admin Panel */}
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-card-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t('adminPanel')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <AdminPanelButton />
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-card-foreground flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('languageAndLocalization')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <LanguageSelector />
          </CardContent>
        </Card>

        {/* Distributor Settings */}
        <DistributorSettings />

        {/* Bluetooth Printer Settings */}
        <BluetoothDevicesSettings />

        {/* Account Actions */}
        <Card className="border border-destructive/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-card-foreground flex items-center gap-2">
              <LogOut className="h-4 w-4 text-destructive" />
              {t('accountActions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
              size="sm"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t('signOut')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;