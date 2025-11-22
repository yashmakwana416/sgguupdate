import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Shield, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function PendingApproval() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user now has a role every 5 seconds
    const interval = setInterval(async () => {
      if (user) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data?.role) {
          // User has been assigned a role, refresh the page to trigger routing
          window.location.reload();
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="glass-card max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 glass-card bg-primary-glass w-fit rounded-full">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-card-foreground">
            {t('accountPendingApproval')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Shield className="h-5 w-5" />
              <span>{t('yourAccountBeingReviewed')}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('welcomeAccountCreated')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('willReceiveAccessOnceApproved')}
            </p>
          </div>
          
          <div className="pt-4 border-t border-glass-border">
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>{t('loggedInAs')} <span className="font-medium text-card-foreground">{user?.email}</span></p>
              <p>{t('status')}: <span className="text-amber-500 font-medium">{t('statusPendingApproval')}</span></p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full glass-button"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t('signOut')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}