import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface ProductListSelectorProps {
  products: Product[] | undefined;
  selectedProductIds?: string[];
  onProductAdd: (product: Product) => void;
}

export const ProductListSelector = ({ products, selectedProductIds = [], onProductAdd }: ProductListSelectorProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();

  if (!products || products.length === 0) {
    return (
      <Card className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border">
        <CardContent className="p-0 text-center py-8">
          <p className="text-sm text-muted-foreground">No products available</p>
        </CardContent>
      </Card>
    );
  }

  const sortedProducts = [...products].sort((a, b) => a.sku.localeCompare(b.sku));

  return (
    <Card className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border">
      <CardHeader className="p-0 pb-3 sm:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-semibold">{t('addItems')}</CardTitle>
          <Badge variant="secondary" className="text-xs">{products.length} products</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-2 max-h-[55vh] sm:max-h-96 overflow-y-auto pr-1 scrollbar-thin">
          {sortedProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-white hover:bg-accent/30 hover:border-primary/30 transition-all duration-200 gap-2 sm:gap-3 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px] sm:text-xs font-mono shrink-0">
                    {product.sku}
                  </Badge>
                  {product.stock_quantity < 10 && (
                    <Badge variant="destructive" className="text-[9px] sm:text-[10px]">
                      Low stock
                    </Badge>
                  )}
                </div>
                <div className="font-medium text-card-foreground text-sm sm:text-base truncate">
                  {product.name}
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs sm:text-sm">
                  <span className="text-primary font-semibold">₹{product.price}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">Stock: {product.stock_quantity}</span>
                </div>
              </div>
              <Button
                onClick={() => {
                  onProductAdd(product);
                  toast({
                    title: "Added",
                    description: `${product.name} added to invoice`,
                  });
                }}
                size="sm"
                disabled={selectedProductIds.includes(product.id)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all shrink-0 h-9 w-9 sm:h-10 sm:w-10 p-0 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
