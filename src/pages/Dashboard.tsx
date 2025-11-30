import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Package, FileText, CreditCard, TrendingUp, DollarSign, Loader2, ArrowUpRight, ChevronRight, AlertTriangle, Eye, ChefHat, PlusCircle, Warehouse, RotateCcw, Truck, Activity, Box, ShoppingBag, Settings, Shield } from 'lucide-react';
import { useParties } from '@/hooks/useParties';
import { useProducts } from '@/hooks/useProducts';
import { useInvoices } from '@/hooks/useInvoices';
import { useRawMaterials } from '@/hooks/useRawMaterials';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useUserRole } from '@/hooks/useUserRole';

export default function Dashboard() {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const {
    parties,
    isLoading: partiesLoading
  } = useParties();
  const {
    products,
    isLoading: productsLoading
  } = useProducts();
  const {
    invoices,
    isLoading: invoicesLoading
  } = useInvoices();
  const {
    data: rawMaterials,
    isLoading: rawMaterialsLoading
  } = useRawMaterials();
  const isLoading = partiesLoading || productsLoading || invoicesLoading || rawMaterialsLoading;
  const { isSuperAdmin } = useUserRole();

  // Calculate real metrics from invoices
  const totalSales = invoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0) || 0;
  const totalInvoices = invoices?.length || 0;
  const paidInvoices = invoices?.filter(inv => inv.status === 'paid').length || 0;
  const pendingAmount = invoices?.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + inv.total, 0) || 0;
  const overdueInvoices = invoices?.filter(inv => inv.status === 'overdue').length || 0;
  const stats = [{
    title: t('parties'),
    value: parties?.length || 0,
    icon: Users,
    change: '+12%',
    changeType: 'positive' as const,
    route: '/parties',
    description: t('manageSuppliersAndCustomers')
  }, {
    title: t('products'),
    value: products?.length || 0,
    icon: Package,
    change: '+5%',
    changeType: 'positive' as const,
    route: '/products',
    description: t('manageYourProductCatalog')
  }, {
    title: t('totalInvoices'),
    value: totalInvoices,
    icon: FileText,
    change: totalInvoices > 0 ? '+18%' : '0%',
    changeType: 'positive' as const,
    route: '/invoices',
    description: t('viewAndManageAllInvoices')
  }, {
    title: t('paidAmount'),
    value: `₹${totalSales.toLocaleString()}`,
    icon: TrendingUp,
    change: totalSales > 0 ? '+24%' : '0%',
    changeType: 'positive' as const,
    route: '/invoices',
    description: 'Total received payments'
  }, {
    title: t('pendingAmount'),
    value: `₹${pendingAmount.toLocaleString()}`,
    icon: CreditCard,
    change: pendingAmount > 0 ? '+8%' : '0%',
    changeType: pendingAmount > 0 ? 'negative' as const : 'positive' as const,
    route: '/invoices',
    description: 'Outstanding amount'
  }];

  // Get recent invoices (last 5)
  const recentInvoices = invoices?.slice(0, 5) || [];
  // Filter products where current stock is less than or equal to 10 (low stock threshold)
  const lowStockProducts = products?.filter(product => (product.stock_quantity ?? 0) <= 10).sort((a, b) => (a.stock_quantity ?? 0) - (b.stock_quantity ?? 0)).slice(0, 3) || [];

  // Filter raw materials where current stock is less than minimum stock
  const lowStockRawMaterials = rawMaterials?.filter(material => {
    const currentTotalGrams = material.total_stock_grams;
    const minimumTotalGrams = material.minimum_stock_kg * 1000 + material.minimum_stock_grams;
    return currentTotalGrams <= minimumTotalGrams;
  }).sort((a, b) => a.total_stock_grams - b.total_stock_grams).slice(0, 3) || [];

  // Loading spinner removed as per request

  return <div className="space-y-4">
    <div>
      <h1 className="text-2xl font-bold text-foreground">{t('dashboard')}</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Welcome to your billing software dashboard
      </p>
    </div>

    {/* Quick Actions Section - Moved to Top */}
    <Card className="border bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-card-foreground">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
          {/* Always visible actions */}
          <Button variant="outline" onClick={() => navigate('/create-invoice')} className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-primary/10 hover:border-primary/30">
            <PlusCircle className="h-4 w-4" />
            <span className="text-xs text-center">{t('createInvoice')}</span>
          </Button>
          <Button variant="outline" onClick={() => navigate('/parties')} className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-primary/10 hover:border-primary/30">
            <Users className="h-4 w-4" />
            <span className="text-xs text-center">{t('parties')}</span>
          </Button>
          <Button variant="outline" onClick={() => navigate('/products')} className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-primary/10 hover:border-primary/30">
            <Package className="h-4 w-4" />
            <span className="text-xs text-center">{t('products')}</span>
          </Button>
          <Button variant="outline" onClick={() => navigate('/invoices')} className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-primary/10 hover:border-primary/30">
            <FileText className="h-4 w-4" />
            <span className="text-xs text-center">{t('invoices')}</span>
          </Button>
          <Button variant="outline" onClick={() => navigate('/inventory')} className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-primary/10 hover:border-primary/30">
            <Warehouse className="h-4 w-4" />
            <span className="text-xs text-center">{t('inventory')}</span>
          </Button>
          <Button variant="outline" onClick={() => navigate('/returns')} className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-primary/10 hover:border-primary/30">
            <RotateCcw className="h-4 w-4" />
            <span className="text-xs text-center">{t('returns')}</span>
          </Button>

          {/* SuperAdmin only actions */}
          {isSuperAdmin() && (
            <>
              <Button variant="outline" onClick={() => navigate('/distributors-data')} className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-primary/10 hover:border-primary/30">
                <Truck className="h-4 w-4" />
                <span className="text-xs text-center">{t('distributorsData')}</span>
              </Button>
              <Button variant="outline" onClick={() => navigate('/operations')} className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-primary/10 hover:border-primary/30">
                <Activity className="h-4 w-4" />
                <span className="text-xs text-center">{t('operations')}</span>
              </Button>
              <Button variant="outline" onClick={() => navigate('/packaging')} className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-primary/10 hover:border-primary/30">
                <Box className="h-4 w-4" />
                <span className="text-xs text-center">{t('packaging')}</span>
              </Button>
              <Button variant="outline" onClick={() => navigate('/loose-maal')} className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-primary/10 hover:border-primary/30">
                <ShoppingBag className="h-4 w-4" />
                <span className="text-xs text-center">{t('looseMaal')}</span>
              </Button>
              <Button variant="outline" onClick={() => navigate('/admin-panel')} className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-primary/10 hover:border-primary/30">
                <Shield className="h-4 w-4" />
                <span className="text-xs text-center">{t('adminPanel')}</span>
              </Button>
            </>
          )}

          {/* Settings - always visible */}
          <Button variant="outline" onClick={() => navigate('/settings')} className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-primary/10 hover:border-primary/30">
            <Settings className="h-4 w-4" />
            <span className="text-xs text-center">{t('settings')}</span>
          </Button>
        </div>
      </CardContent>
    </Card>


    {/* Stats Grid */}
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
      {stats.map(stat => {
        const Icon = stat.icon;
        return <Card key={stat.title} className="hover:shadow-md transition-all duration-200 cursor-pointer group border" onClick={() => navigate(stat.route)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Icon className="h-4 w-4 text-primary" />
              <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="text-lg font-bold text-card-foreground mb-1">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.title}</p>
          </CardContent>
        </Card>;
      })}
    </div>

  </div>;
}
