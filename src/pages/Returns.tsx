import { useState } from 'react';
import { Plus, Search, Package2, Calendar, TrendingUp, AlertCircle, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useReturns, CreateReturnData } from '@/hooks/useReturns';
import { useParties } from '@/hooks/useParties';
import { useProducts } from '@/hooks/useProducts';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const Returns = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [partySearchOpen, setPartySearchOpen] = useState(false);
  const [partySearchValue, setPartySearchValue] = useState('');
  const [selectedParty, setSelectedParty] = useState<any>(null);

  const { returns, isLoading, createReturn } = useReturns();
  const { parties } = useParties();
  const { products } = useProducts();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreateReturnData>();

  const selectedProductId = watch('product_id');
  const selectedProduct = products?.find(p => p.id === selectedProductId);
  const quantity = watch('quantity_returned');

  const filteredReturns = returns?.filter(ret =>
    ret.party_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ret.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ret.return_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalReturns = returns?.length || 0;
  const totalReturnValue = returns?.reduce((sum, ret) => sum + ret.total_amount, 0) || 0;
  const todayReturns = returns?.filter(ret =>
    new Date(ret.date).toDateString() === new Date().toDateString()
  ).length || 0;

  const handlePartySelect = (party: any) => {
    setSelectedParty(party);
    setValue('party_id', party.id);
    setPartySearchValue(party.name);
    setPartySearchOpen(false);
  };

  const onSubmit = async (data: CreateReturnData) => {
    if (!selectedProduct) return;

    const returnData = {
      ...data,
      product_name: selectedProduct.name,
      unit_price: selectedProduct.price,
      party_name: parties?.find(p => p.id === data.party_id)?.name || '',
      date: data.date || new Date().toISOString().split('T')[0],
    };

    try {
      await createReturn.mutateAsync(returnData);
      setIsCreateDialogOpen(false);
      setSelectedParty(null);
      setPartySearchValue('');
      reset();
    } catch (error) {
      console.error('Failed to create return:', error);
    }
  };

  const handleProductSelect = (productId: string) => {
    setValue('product_id', productId);
    const product = products?.find(p => p.id === productId);
    if (product) {
      setValue('unit_price', product.price);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">{t('returnsManagement')}</h1>
          <p className="text-muted-foreground">{t('processAndTrackProductReturns')}</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/30 border border-primary/40">
              <Plus className="h-4 w-4 mr-2" />
              {t('processReturn')}
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card max-w-[94vw] w-full sm:max-w-lg mx-3 sm:mx-4 max-h-[88vh] sm:max-h-[85vh] overflow-y-auto p-3 sm:p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">{t('processNewReturn')}</DialogTitle>
              <DialogDescription className="text-sm">
                {t('enterReturnDetails')}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-sm font-medium">{t('returnDate')}</Label>
                <Input
                  id="date"
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  {...register('date')}
                  className="glass-input h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('partyName')}</Label>
                <Popover open={partySearchOpen} onOpenChange={setPartySearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={partySearchOpen}
                      className="w-full justify-between glass-input h-10 text-sm"
                    >
                      {selectedParty ? selectedParty.name : partySearchValue || t('selectPartyDots')}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 glass-card" align="start">
                    <Command>
                      <CommandInput
                        placeholder={t('searchParties')}
                        value={partySearchValue}
                        onValueChange={setPartySearchValue}
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>
                          <p className="text-sm text-muted-foreground p-2">{t('noPartyFound')}</p>
                        </CommandEmpty>
                        <CommandGroup>
                          {parties?.map((party) => (
                            <CommandItem
                              key={party.id}
                              onSelect={() => handlePartySelect(party)}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedParty?.id === party.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{party.name}</div>
                                {(party.phone || party.email) && (
                                  <div className="text-xs text-muted-foreground">
                                    {party.phone} {party.email && `• ${party.email}`}
                                  </div>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.party_id && (
                  <p className="text-xs text-destructive mt-1">Party is required</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product_id" className="text-sm font-medium">{t('product')}</Label>
                <Select onValueChange={handleProductSelect}>
                  <SelectTrigger className="glass-input h-10 text-sm">
                    <SelectValue placeholder={t('selectProductDots')} />
                  </SelectTrigger>
                  <SelectContent className="glass-card max-h-[200px] overflow-y-auto">
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id} className="text-sm">
                        <div className="flex justify-between items-center w-full">
                          <span className="truncate pr-2">{product.name}</span>
                          <Badge variant="outline" className="text-xs shrink-0">₹{product.price}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.product_id && (
                  <p className="text-xs text-destructive mt-1">Product is required</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quantity_returned" className="text-sm font-medium">{t('quantityReturned')}</Label>
                <Input
                  id="quantity_returned"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder={t('enterQuantityDots')}
                  {...register('quantity_returned', {
                    required: 'Quantity is required',
                    min: { value: 0.01, message: 'Quantity must be positive' }
                  })}
                  className="glass-input h-10 text-sm"
                />
                {errors.quantity_returned && (
                  <p className="text-xs text-destructive mt-1">{errors.quantity_returned.message}</p>
                )}
              </div>

              {selectedProduct && quantity && (
                <div className="glass-card p-2.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{t('returnValue')}:</span>
                    <span className="font-semibold text-primary">
                      ₹{(selectedProduct.price * Number(quantity)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="reason" className="text-sm font-medium">{t('reason')} ({t('optional')})</Label>
                <Textarea
                  id="reason"
                  placeholder={t('reasonForReturn')}
                  {...register('reason')}
                  className="glass-input text-sm min-h-[80px] resize-none"
                  rows={3}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={createReturn.isPending}
                  className="glass-button flex-1 h-10 text-sm"
                >
                  {createReturn.isPending ? t('processing') : t('processReturn')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="glass-button-outline h-10 text-sm sm:w-20"
                >
                  {t('cancel')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalReturns')}</CardTitle>
            <Package2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReturns}</div>
            <p className="text-xs text-muted-foreground">
              {t('allTimeReturnsProcessed')}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('returnValue')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalReturnValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {t('totalValueOfReturns')}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('todaysReturns')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayReturns}</div>
            <p className="text-xs text-muted-foreground">
              {t('returnsProcessedToday')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="glass-card">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg sm:text-xl">{t('returnHistory')}</CardTitle>
              <CardDescription className="text-sm">{t('trackAllProcessedReturns')}</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('searchReturns')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 glass-input h-9 text-sm w-full sm:w-64"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-6">
          {filteredReturns?.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-base sm:text-lg mb-2">{t('noReturnsFound')}</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base px-4">
                {searchTerm ? t('noReturnsMatchSearch') : t('noReturnsProcessedYet')}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateDialogOpen(true)} className="glass-button text-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('processFirstReturn')}
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-medium text-sm">{t('returnNumber')}</th>
                      <th className="text-left py-3 px-2 font-medium text-sm">{t('date')}</th>
                      <th className="text-left py-3 px-2 font-medium text-sm">{t('partyName')}</th>
                      <th className="text-left py-3 px-2 font-medium text-sm">{t('product')}</th>
                      <th className="text-left py-3 px-2 font-medium text-sm">{t('quantity')}</th>
                      <th className="text-left py-3 px-2 font-medium text-sm">{t('value')}</th>
                      <th className="text-left py-3 px-2 font-medium text-sm">{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredReturns?.map((returnItem) => (
                      <tr key={returnItem.id} className="hover:bg-muted/50">
                        <td className="py-3 px-2">
                          <span className="font-mono text-xs">{returnItem.return_number}</span>
                        </td>
                        <td className="py-3 px-2 text-sm">
                          {format(new Date(returnItem.date), 'MMM dd, yyyy')}
                        </td>
                        <td className="py-3 px-2 text-sm">{returnItem.party_name}</td>
                        <td className="py-3 px-2 text-sm">{returnItem.product_name}</td>
                        <td className="py-3 px-2 text-sm">{returnItem.quantity_returned}</td>
                        <td className="py-3 px-2 text-sm">₹{returnItem.total_amount.toFixed(2)}</td>
                        <td className="py-3 px-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                            {t(returnItem.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filteredReturns?.map((returnItem) => (
                  <Card key={returnItem.id} className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-mono text-xs text-muted-foreground mb-1">
                            {returnItem.return_number}
                          </p>
                          <p className="text-sm font-medium">{returnItem.party_name}</p>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                          {t(returnItem.status)}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">{t('date')}:</span>
                          <span className="text-sm">{format(new Date(returnItem.date), 'MMM dd, yyyy')}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">{t('product')}:</span>
                          <span className="text-sm text-right max-w-[60%] truncate" title={returnItem.product_name}>
                            {returnItem.product_name}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">{t('quantity')}:</span>
                          <span className="text-sm font-medium">{returnItem.quantity_returned}</span>
                        </div>

                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="text-xs text-muted-foreground">{t('value')}:</span>
                          <span className="text-sm font-semibold text-primary">
                            ₹{returnItem.total_amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Returns;