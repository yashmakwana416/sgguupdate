import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Save, Loader2 } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

export const DistributorSettings = () => {
    const { isDistributor, userRole } = useUserRole();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        company_name: '',
        mobile_number: '',
        address: '',
        tagline: '',
        signature_name: ''
    });

    useEffect(() => {
        if (userRole === 'distributor') {
            fetchSettings();
        }
    }, [userRole]);

    if (!isDistributor()) return null;

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('distributor_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching settings:', error);
                return;
            }

            if (data) {
                const settings = data as any;
                setFormData({
                    company_name: settings.company_name || '',
                    mobile_number: settings.mobile_number || '',
                    address: settings.address || '',
                    tagline: settings.tagline || '',
                    signature_name: settings.signature_name || ''
                });
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast({
                    title: "Error",
                    description: "You must be logged in to save settings.",
                    variant: "destructive"
                });
                return;
            }

            const { error } = await supabase
                .from('distributor_settings')
                .upsert({
                    user_id: user.id,
                    company_name: formData.company_name,
                    mobile_number: formData.mobile_number,
                    address: formData.address,
                    tagline: formData.tagline,
                    signature_name: formData.signature_name,
                    updated_at: new Date().toISOString()
                } as any);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Distributor details saved successfully."
            });
        } catch (error) {
            console.error('Error saving settings:', error);
            toast({
                title: "Error",
                description: "Failed to save settings.",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="text-card-foreground flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Distributor Details
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                    Manage your company details for invoices
                </p>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                            id="companyName"
                            placeholder="Enter your company name"
                            value={formData.company_name}
                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="mobileNumber">Mobile Number</Label>
                        <Input
                            id="mobileNumber"
                            placeholder="Enter mobile number"
                            value={formData.mobile_number}
                            onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                            id="address"
                            placeholder="Enter your business address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tagline">Company Tagline</Label>
                        <Input
                            id="tagline"
                            placeholder="Enter your company tagline or motto"
                            value={formData.tagline}
                            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="signatureName">Authorized Signature Name</Label>
                        <Input
                            id="signatureName"
                            placeholder="Enter authorized signatory name"
                            value={formData.signature_name}
                            onChange={(e) => setFormData({ ...formData, signature_name: e.target.value })}
                        />
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="w-full"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Details
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
