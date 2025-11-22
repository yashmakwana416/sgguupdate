import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Package, FileText, CreditCard, TrendingUp, DollarSign, Loader2, ArrowUpRight, ChevronRight, AlertTriangle, Eye, ChefHat } from 'lucide-react';
import { useParties } from '@/hooks/useParties';
import { useProducts } from '@/hooks/useProducts';
import { useInvoices } from '@/hooks/useInvoices';
import { useRawMaterials } from '@/hooks/useRawMaterials';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
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
  const lowStockProducts = products?.filter(product => product.stock_quantity <= 10 && product.stock_quantity >= 0).sort((a, b) => a.stock_quantity - b.stock_quantity).slice(0, 3) || [];

  // Filter raw materials where current stock is less than minimum stock
  const lowStockRawMaterials = rawMaterials?.filter(material => {
    const currentTotalGrams = material.total_stock_grams;
    const minimumTotalGrams = material.minimum_stock_kg * 1000 + material.minimum_stock_grams;
    return currentTotalGrams <= minimumTotalGrams;
  }).sort((a, b) => a.total_stock_grams - b.total_stock_grams).slice(0, 3) || [];
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>;
  }
  return <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-responsive-lg font-bold text-foreground">{t('dashboard')}</h1>
        <p className="text-responsive-sm text-muted-foreground mt-2">
          Welcome to your billing software dashboard
        </p>
      </div>

      {/* Quick Actions Section - Moved to Top */}
      <Card className="mobile-card bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-responsive-base text-card-foreground">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" onClick={() => navigate('/create-invoice')} className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-primary/10 hover:border-primary/30">
              <FileText className="h-5 w-5" />
              <span className="text-xs">{t('createInvoice')}</span>
            </Button>
            <Button variant="outline" onClick={() => navigate('/parties')} className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-primary/10 hover:border-primary/30">
              <Users className="h-5 w-5" />
              <span className="text-xs">{t('addParty')}</span>
            </Button>
            <Button variant="outline" onClick={() => navigate('/products')} className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-primary/10 hover:border-primary/30">
              <Package className="h-5 w-5" />
              <span className="text-xs">{t('addProduct')}</span>
            </Button>
            <Button variant="outline" onClick={() => navigate('/invoices')} className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-primary/10 hover:border-primary/30">
              <FileText className="h-5 w-5" />
              <span className="text-xs">{t('invoices')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="mobile-stats-grid">
        {stats.map(stat => {
        const Icon = stat.icon;
        return <Card key={stat.title} className="mobile-card hover:shadow-lg transition-all duration-200 cursor-pointer group" onClick={() => navigate(stat.route)}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-responsive-sm font-medium text-card-foreground">
                  {stat.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-card-foreground">{stat.value}</div>
                
                <p className="text-xs text-muted-foreground mt-1 truncate">{stat.description}</p>
                <Button variant="ghost" size="sm" className="mt-2 h-6 px-2 text-xs w-full">
                  View Details <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>;
      })}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Invoices */}
        <Card className="mobile-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-responsive-base text-card-foreground">{t('invoices')}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')} className="text-xs">
              View All <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {recentInvoices.length > 0 ? recentInvoices.map(invoice => <div key={invoice.id} className="flex items-center justify-between p-3 glass-card hover:bg-accent/5 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-responsive-sm font-medium text-card-foreground">{invoice.invoiceNumber}</p>
                        <Badge variant={invoice.status === 'paid' ? 'default' : invoice.status === 'overdue' ? 'destructive' : 'outline'} className="text-xs">
                          {t(invoice.status)}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">{invoice.customerName}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(invoice.date), 'MMM dd, yyyy')}</p>
                    </div>
                    <div className="text-right ml-4 flex flex-col items-end gap-1">
                      <p className="text-responsive-sm font-medium text-card-foreground">₹{invoice.total.toLocaleString()}</p>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')} className="h-6 px-2 text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>) : <div className="text-center py-6 sm:py-4">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-responsive-sm text-muted-foreground">{t('noInvoicesFound')}</p>
                  <Button variant="outline" size="sm" onClick={() => navigate('/create-invoice')} className="mt-2">
                    {t('createInvoice')}
                  </Button>
                </div>}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Products Alert */}
        <Card className="mobile-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-responsive-base text-card-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              {t('lowStock')} - Products
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/products')} className="text-xs">
              View All <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {lowStockProducts.length > 0 ? lowStockProducts.map(product => <div key={product.id} className="flex items-center justify-between p-3 glass-card border-l-4 border-l-destructive hover:bg-accent/5 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-responsive-sm font-medium text-card-foreground">{product.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">SKU: {product.sku}</p>
                      <p className="text-xs text-muted-foreground">Unit: {product.unit}</p>
                    </div>
                    <div className="text-right ml-4 flex flex-col items-end gap-1">
                      <p className="text-responsive-sm font-medium text-destructive">{product.stock_quantity} {product.unit}</p>
                      <p className="text-xs text-muted-foreground">{t('lowStock')}</p>
                      <Button variant="outline" size="sm" onClick={() => navigate('/products')} className="h-6 px-2 text-xs">
                        Update Stock
                      </Button>
                    </div>
                  </div>) : <div className="text-center py-6 sm:py-4">
                  <Package className="h-8 w-8 text-accent mx-auto mb-2" />
                  <p className="text-responsive-sm text-muted-foreground">All products well stocked</p>
                  <Button variant="outline" size="sm" onClick={() => navigate('/products')} className="mt-2">
                    Manage Products
                  </Button>
                </div>}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Raw Materials Alert */}
        <Card className="mobile-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-responsive-base text-card-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              {t('lowStock')} - Raw Materials
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/inventory')} className="text-xs">
              View All <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {lowStockRawMaterials.length > 0 ? lowStockRawMaterials.map(material => {
              const currentKg = material.current_stock_kg;
              const currentGrams = material.current_stock_grams;
              const minKg = material.minimum_stock_kg;
              const minGrams = material.minimum_stock_grams;
              return <div key={material.id} className="flex items-center justify-between p-3 glass-card border-l-4 border-l-destructive hover:bg-accent/5 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-responsive-sm font-medium text-card-foreground">{material.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Min: {minKg}kg {minGrams}g
                      </p>
                    </div>
                    <div className="text-right ml-4 flex flex-col items-end gap-1">
                      <p className="text-responsive-sm font-medium text-destructive">
                        {currentKg}kg {currentGrams}g
                      </p>
                      <p className="text-xs text-muted-foreground">{t('lowStock')}</p>
                      <Button variant="outline" size="sm" onClick={() => navigate('/inventory')} className="h-6 px-2 text-xs">
                        Update Stock
                      </Button>
                    </div>
                  </div>;
            }) : <div className="text-center py-6 sm:py-4">
                  <ChefHat className="h-8 w-8 text-accent mx-auto mb-2" />
                  <p className="text-responsive-sm text-muted-foreground">All raw materials well stocked</p>
                  <Button variant="outline" size="sm" onClick={() => navigate('/inventory')} className="mt-2">
                    Manage Inventory
                  </Button>
                </div>}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>;
}