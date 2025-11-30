import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Save, Loader2, Edit } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

export const DistributorSettings = () => {
    const { isDistributor, userRole } = useUserRole();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(true);
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
                // If data exists, set to view mode
                setIsEditing(false);
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

            // Switch to view mode after successful save
            setIsEditing(false);
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

    const handleEdit = () => {
        setIsEditing(true);
    };

    return (
        <Card className="border">
            <CardHeader className="pb-3">
                <CardTitle className="text-base text-card-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Distributor Details
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className={`space-y-3 transition-all duration-200 ${!isEditing ? 'opacity-60' : 'opacity-100'}`}>
                    <div className="space-y-1.5">
                        <Label htmlFor="companyName" className="text-xs">Company Name</Label>
                        <Input
                            id="companyName"
                            placeholder="Enter your company name"
                            value={formData.company_name}
                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                            className="h-9"
                            disabled={!isEditing}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="mobileNumber" className="text-xs">Mobile Number</Label>
                        <Input
                            id="mobileNumber"
                            placeholder="Enter mobile number"
                            value={formData.mobile_number}
                            onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                            className="h-9"
                            disabled={!isEditing}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="address" className="text-xs">Address</Label>
                        <Textarea
                            id="address"
                            placeholder="Enter your business address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="min-h-[60px]"
                            disabled={!isEditing}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="tagline" className="text-xs">Company Tagline</Label>
                        <Input
                            id="tagline"
                            placeholder="Enter your company tagline or motto"
                            value={formData.tagline}
                            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                            className="h-9"
                            disabled={!isEditing}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="signatureName" className="text-xs">Authorized Signature Name</Label>
                        <Input
                            id="signatureName"
                            placeholder="Enter authorized signatory name"
                            value={formData.signature_name}
                            onChange={(e) => setFormData({ ...formData, signature_name: e.target.value })}
                            className="h-9"
                            disabled={!isEditing}
                        />
                    </div>

                    {isEditing ? (
                        <Button
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="w-full"
                            size="sm"
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
                    ) : (
                        <Button
                            onClick={handleEdit}
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200"
                            size="sm"
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            <span className="font-semibold text-black">Edit Details</span>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
