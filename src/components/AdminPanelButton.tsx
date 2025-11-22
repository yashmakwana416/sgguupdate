import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';

export function AdminPanelButton() {
  const { isSuperAdmin, loading } = useUserRole();
  const navigate = useNavigate();

  // Only show for superadmin
  if (loading || !isSuperAdmin()) {
    return null;
  }
  const handleAdminPanel = () => {
    // Navigate to admin panel
    navigate('/admin-panel');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAdminPanel}
      className="glass-button border-primary/20 text-primary hover:bg-primary/10"
    >
      <Shield className="h-4 w-4 mr-2" />
      Admin Panel
    </Button>
  );
}