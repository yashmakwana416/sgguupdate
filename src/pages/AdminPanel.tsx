import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Shield, UserPlus, Users, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useRoles } from '@/hooks/useRoles';

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
}

interface UserRoleWithEmail {
  id: string;
  user_id: string;
  role: 'superadmin' | 'distributor';
  user_email: string;
  created_at?: string;
}

export default function AdminPanel() {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRolesWithEmail, setUserRolesWithEmail] = useState<UserRoleWithEmail[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'superadmin' | 'distributor'>('distributor');
  const [loading, setLoading] = useState(true);
  const { userRoles, assignRole, removeRole } = useRoles();

  const roleOptions = [
    { value: 'superadmin', label: 'Super Admin' },
    { value: 'distributor', label: 'Distributor' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Transform user roles data and get user emails
    if (userRoles.length > 0 && profiles.length > 0) {
      const transformedRoles = userRoles.map(role => {
        const userProfile = profiles.find(p => p.id === role.user_id);
        return {
          ...role,
          user_email: userProfile?.email || 'Unknown'
        };
      });
      setUserRolesWithEmail(transformedRoles);
    }
  }, [userRoles, profiles]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('email');

      if (profilesError) throw profilesError;

      setProfiles(profilesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedEmail || !selectedRole) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      // Find user by email
      const user = profiles.find(p => p.email === selectedEmail);
      if (!user) {
        toast.error('User not found with this email');
        return;
      }

      await assignRole(user.id, selectedRole);

      // Reset form and close dialog
      setSelectedEmail('');
      setSelectedRole('distributor');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  };

  const handleRemoveRole = async (roleId: string, userId: string) => {
    if (!confirm('Are you sure you want to remove this user completely? They will be logged out and unable to login until you assign them a role again.')) {
      return;
    }

    try {
      // Remove the role
      await removeRole(roleId);

      // Force sign out the user from Supabase auth (requires admin API)
      // Note: This will be handled by RLS - when role is removed, user loses access

      toast.success('User removed successfully');
      fetchData(); // Refresh the data
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Failed to remove user');
    }
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.email.toLowerCase().includes(searchEmail.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 glass-card bg-primary-glass">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('adminPanelTitle')}</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">{t('manageUserRolesAndPermissions')}</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="glass-button bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
              <UserPlus className="h-4 w-4 mr-2" />
              {t('assignRole')}
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card max-w-[95vw] sm:max-w-md mx-4 sm:mx-auto border-2 border-glass-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-card-foreground text-base sm:text-lg">{t('assignUserRole')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-card-foreground">{t('userEmail')}</Label>
                <Select value={selectedEmail} onValueChange={setSelectedEmail}>
                  <SelectTrigger className="glass-input border border-glass-border">
                    <SelectValue placeholder={t('selectUserEmail')} />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover text-popover-foreground border border-glass-border shadow-lg">
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.email}>
                        {profile.email} {profile.first_name && profile.last_name &&
                          `(${profile.first_name} ${profile.last_name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


              <div>
                <Label htmlFor="role" className="text-card-foreground">{t('role')}</Label>
                <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val as 'superadmin' | 'distributor')}>
                  <SelectTrigger className="glass-input border border-glass-border">
                    <SelectValue placeholder={t('selectRole')} />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover text-popover-foreground border border-glass-border shadow-lg">
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleAssignRole}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!selectedEmail || !selectedRole}
                >
                  {t('assignRole')}
                </Button>
                <Button
                  variant="outline"
                  className="glass-button border border-glass-border"
                  onClick={() => setIsDialogOpen(false)}
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {/* Users List */}
        <Card className="glass-card">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <CardTitle className="text-base sm:text-lg text-card-foreground flex items-center gap-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                {t('registeredUsers')}
              </CardTitle>
              <div className="relative flex-1 sm:max-w-sm sm:ml-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchByEmail')}
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="glass-input pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredProfiles.map((profile) => (
                <div key={profile.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 glass-card gap-2 sm:gap-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base text-card-foreground truncate">{profile.email}</p>
                    {profile.first_name && profile.last_name && (
                      <p className="text-sm text-muted-foreground">
                        {profile.first_name} {profile.last_name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {userRolesWithEmail.find(r => r.user_id === profile.id) && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {userRolesWithEmail.find(r => r.user_id === profile.id)?.role}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              ))}
              {filteredProfiles.length === 0 && (
                <p className="text-center py-4 text-muted-foreground text-sm">
                  {searchEmail ? t('noUsersFoundMatchingSearch') : t('noUsersFound')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Assignments Table */}
      <Card className="glass-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg text-card-foreground">{t('currentRoleAssignments')}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-lg glass-card p-1 overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow className="border-glass-border">
                    <TableHead className="text-xs sm:text-sm text-muted-foreground font-semibold">{t('userEmailTitle')}</TableHead>
                    <TableHead className="text-xs sm:text-sm text-muted-foreground font-semibold">{t('role')}</TableHead>
                    <TableHead className="text-xs sm:text-sm text-muted-foreground font-semibold">{t('assigned')}</TableHead>
                    <TableHead className="text-xs sm:text-sm text-muted-foreground font-semibold">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRolesWithEmail.map((userRole) => (
                    <TableRow key={userRole.id} className="border-glass-border hover:bg-primary-glass/30">
                      <TableCell className="font-medium text-card-foreground">
                        {userRole.user_email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {userRole.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-card-foreground text-sm">
                        {userRole.created_at ? new Date(userRole.created_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveRole(userRole.id, userRole.user_id)}
                          className="glass-button text-destructive hover:bg-destructive-glass"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {userRolesWithEmail.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                        {t('noRoleAssignmentsFound')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}