import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
import { ArrowLeft, Loader2, Shield, User, Users } from 'lucide-react';
import { format } from 'date-fns';

interface UserWithRole {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function UserManagement() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error('Access denied', { description: 'Admin privileges required' });
      navigate('/');
    }
  }, [authLoading, isAdmin, navigate]);

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

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    if (userId === user?.id) {
      toast.error('Cannot change your own role');
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

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
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

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              View and manage user roles. Admins have full access to all features.
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
                          {u.role === 'admin' ? (
                            <Shield className="h-4 w-4 text-primary" />
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
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
                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                          {u.role}
                        </Badge>
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
                            onValueChange={(value) => handleRoleChange(u.user_id, value as 'admin' | 'user')}
                            disabled={updatingUserId === u.user_id}
                          >
                            <SelectTrigger className="w-28">
                              {updatingUserId === u.user_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <SelectValue />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
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
