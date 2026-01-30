import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AccessDenied from './AccessDenied';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Shield, User, Users, Crown, Eye, UserCheck, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserWithRole {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

const ROLE_CONFIG: Record<string, { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  super_admin: { label: 'Super Admin', icon: <Crown className="h-4 w-4" />, variant: 'destructive' },
  admin: { label: 'Admin', icon: <Shield className="h-4 w-4" />, variant: 'default' },
  supervisor: { label: 'Supervisor', icon: <Eye className="h-4 w-4" />, variant: 'secondary' },
  coordinator: { label: 'Coordinator', icon: <UserCheck className="h-4 w-4" />, variant: 'outline' },
  user: { label: 'User', icon: <User className="h-4 w-4" />, variant: 'outline' },
};

export default function UserManagement() {
  const { user, isAdmin, isSuperAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // No redirect - we show AccessDenied component instead

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.rpc('get_all_users_with_roles');

    if (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } else {
      setUsers(data || []);
    }
    setIsLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    if (userId === user?.id) {
      toast.error('Cannot change your own role');
      return;
    }

    // Only super admins can assign super_admin role
    if (newRole === 'super_admin' && !isSuperAdmin) {
      toast.error('Only super admins can assign the super admin role');
      return;
    }

    setUpdatingUserId(userId);

    const { error } = await supabase.rpc('update_user_role', {
      _user_id: userId,
      _role: newRole,
    });

    if (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role', { description: error.message });
    } else {
      toast.success('Role updated successfully');
      setUsers(users.map(u => 
        u.user_id === userId ? { ...u, role: newRole } : u
      ));
    }

    setUpdatingUserId(null);
  };

  const getRoleIcon = (role: string) => {
    return ROLE_CONFIG[role]?.icon || <User className="h-4 w-4 text-muted-foreground" />;
  };

  const getRoleBadge = (role: string) => {
    const config = ROLE_CONFIG[role] || ROLE_CONFIG.user;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  // Available roles based on current user's privileges
  const availableRoles: AppRole[] = isSuperAdmin 
    ? ['super_admin', 'admin', 'supervisor', 'coordinator', 'user']
    : ['admin', 'supervisor', 'coordinator', 'user'];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <AccessDenied 
        requiredRole="Admin or Super Admin" 
        message="You need administrator privileges to manage users and roles."
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              User Management
            </h1>
            <p className="text-muted-foreground">Manage user roles and permissions</p>
          </div>
        </div>

        {/* Admin Role Indicator */}
        {isSuperAdmin ? (
          <Alert className="bg-amber-500/10 border-amber-500/50">
            <Crown className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              <span className="font-medium">Super Admin Access:</span> Full control over all users and roles. 
              You can assign any role including Super Admin.
            </AlertDescription>
          </Alert>
        ) : isAdmin && (
          <Alert className="bg-primary/10 border-primary/50">
            <Shield className="h-4 w-4 text-primary" />
            <AlertDescription>
              <span className="font-medium">Admin Access:</span> You can manage users and assign roles, 
              except for the Super Admin role which is restricted.
            </AlertDescription>
          </Alert>
        )}

        {/* Role Legend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Role Hierarchy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                <Badge key={role} variant={config.variant} className="flex items-center gap-1">
                  {config.icon}
                  {config.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              View and manage user roles. {isSuperAdmin ? 'As a Super Admin, you can assign any role.' : 'As an Admin, you can assign roles except Super Admin.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(u.role)}
                          <span className="font-medium">
                            {u.full_name || 'Unnamed User'}
                          </span>
                          {u.user_id === user?.id && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(u.role)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(u.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        {u.user_id === user?.id ? (
                          <span className="text-sm text-muted-foreground">—</span>
                        ) : (
                          <Select
                            value={u.role}
                            onValueChange={(value) => handleRoleChange(u.user_id, value as AppRole)}
                            disabled={updatingUserId === u.user_id || (u.role === 'super_admin' && !isSuperAdmin)}
                          >
                            <SelectTrigger className="w-36">
                              {updatingUserId === u.user_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <SelectValue />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              {availableRoles.map((role) => (
                                <SelectItem key={role} value={role}>
                                  <div className="flex items-center gap-2">
                                    {ROLE_CONFIG[role]?.icon}
                                    {ROLE_CONFIG[role]?.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
