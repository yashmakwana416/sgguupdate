import { ChefHat } from 'lucide-react';
import RawMaterialInventory from '@/components/RawMaterialInventory';
import { useTranslation } from 'react-i18next';

const Inventory = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 glass-card">
            <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-responsive-lg font-bold text-foreground">{t('rawMaterialsInventory')}</h1>
            <p className="text-responsive-sm text-muted-foreground">{t('trackAndManageRawMaterials')}</p>
          </div>
        </div>
      </div>

      <RawMaterialInventory />
    </div>
  );
};

export default Inventory;