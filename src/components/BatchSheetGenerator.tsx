import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Download, Package, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BatchSheet } from './BatchSheet';
import { format } from 'date-fns';

interface BatchSheetGeneratorProps {
    batch: any;
    children: React.ReactNode;
}

export const BatchSheetGenerator: React.FC<BatchSheetGeneratorProps> = ({
    batch,
    children
}) => {
    const [showPreview, setShowPreview] = useState(false);
    const { toast } = useToast();

    const [companyDetails, setCompanyDetails] = useState({
        name: "શ્રી ગણેશ ગૃહ ઉદ્યોગ ----- Sakshi Pradip Adad Papad",
        address: "150FI RING ROAD, RAMAPUR",
        landmark: "CHOKDI,SHASTRI NAGAR, B/H LILJAT",
        city: "PAPAD, 19/4 CORNER, RAJKOT",
        state: "Gujarat",
        pincode: "",
        mobile: "9624985555",
        tagline: "આપણો વિશ્વાસુ",
        signature_name: "પ્રજાપતિ મહેશ"
    });

    useEffect(() => {
        const fetchDistributorSettings = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data } = await supabase
                    .from('distributor_settings')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (data) {
                    const settings = data as any;
                    setCompanyDetails(prev => ({
                        ...prev,
                        name: settings.company_name
                            ? `${settings.company_name}`
                            : prev.name,
                        address: settings.address || prev.address,
                        mobile: settings.mobile_number || prev.mobile,
                        tagline: settings.tagline || prev.tagline,
                        signature_name: settings.signature_name || prev.signature_name,
                    }));
                }
            } catch (error) {
                console.error('Error fetching distributor settings:', error);
            }
        };
        fetchDistributorSettings();
    }, []);

    const handleDownload = async () => {
        try {
            const element = document.getElementById('batch-sheet-content');
            if (!element) {
                throw new Error('Batch sheet content not found');
            }

            const html2pdf = (await import('html2pdf.js')).default as any;

            const opt = {
                margin: [10, 10, 10, 10],
                filename: `Batch-${batch.batch_name.replace(/\s+/g, '-')}-${format(new Date(batch.created_at), 'yyyy-MM-dd')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(element).save();

            toast({
                title: "Downloaded Successfully",
                description: "Batch sheet PDF has been downloaded."
            });
        } catch (error) {
            console.error('Download error:', error);
            toast({
                title: "Download Error",
                description: "Failed to generate PDF. Please try again.",
                variant: "destructive"
            });
        }
    };

    const handleTriggerClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowPreview(true);
    };

    return (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogTrigger asChild>
                <div onClick={handleTriggerClick}>
                    {children}
                </div>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:w-full sm:max-w-5xl h-[90vh] p-0 flex flex-col glass-card border-2 shadow-2xl overflow-hidden">
                {/* Header */}
                <DialogHeader className="relative p-4 sm:p-6 border-b glass-border bg-gradient-to-r from-primary/8 via-primary/5 to-accent/8 backdrop-blur-sm shrink-0">
                    <DialogTitle className="flex items-center justify-between gap-3 text-foreground">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-primary/15 rounded-xl shadow-sm">
                                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg sm:text-xl font-bold">Batch Preview</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-muted-foreground font-medium">{batch.batch_name}</span>
                                </div>
                            </div>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                {/* Action Bar */}
                <div className="p-4 sm:p-6 border-b glass-border bg-muted/20 shrink-0 flex justify-end">
                    <Button
                        onClick={handleDownload}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Download PDF
                    </Button>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1 bg-slate-100/50">
                    <div className="p-4 sm:p-8 min-h-full flex justify-center">
                        <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg overflow-hidden">
                            <BatchSheet batch={batch} companyDetails={companyDetails} />
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
