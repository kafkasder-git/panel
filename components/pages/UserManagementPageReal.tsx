/**
 * @fileoverview UserManagementPageReal Module - Application module
 *
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import {
  Activity,
  AlertTriangle,
  Edit,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  UserX,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '../ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Skeleton } from '../ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useToast } from '../../hooks/use-toast';
import { userManagementService } from '../../services/userManagementService';

// Types
interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'admin' | 'moderator' | 'user';
  status: 'active' | 'inactive' | 'suspended';
  last_sign_in_at?: string;
  created_at: string;
  updated_at: string;
  phone?: string;
  organization?: string;
  permissions: string[];
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  new_this_month: number;
}

interface UserFormData {
  email: string;
  full_name: string;
  role: 'admin' | 'moderator' | 'user';
  status: 'active' | 'inactive' | 'suspended';
  phone?: string;
  organization?: string;
  permissions: string[];
}

// User Management Components
const UserStatsCards = ({ stats }: { stats: UserStats }) => (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Toplam</p>
            <p className="text-xl font-bold">{stats.total}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <UserCheck className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Aktif</p>
            <p className="text-xl font-bold">{stats.active}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <UserX className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Pasif</p>
            <p className="text-xl font-bold">{stats.inactive}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Askıya Alınmış</p>
            <p className="text-xl font-bold">{stats.suspended}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Activity className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Bu Ay Yeni</p>
            <p className="text-xl font-bold">{stats.new_this_month}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const UserTable = ({
  users,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onToggleStatus: (userId: string, status: string) => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Kullanıcı Listesi</CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kullanıcı</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Son Giriş</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>
                      {user.full_name?.charAt(0) ?? user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.full_name ?? 'İsimsiz'}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                  {user.role === 'admin'
                    ? 'Yönetici'
                    : user.role === 'moderator'
                      ? 'Moderatör'
                      : 'Kullanıcı'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                  {user.status === 'active'
                    ? 'Aktif'
                    : user.status === 'inactive'
                      ? 'Pasif'
                      : 'Askıya Alınmış'}
                </Badge>
              </TableCell>
              <TableCell>
                {user.last_sign_in_at
                  ? new Date(user.last_sign_in_at).toLocaleDateString('tr-TR')
                  : 'Hiç giriş yapmamış'}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => {
                        onEdit(user);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Düzenle
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        onToggleStatus(user.id, user.status === 'active' ? 'inactive' : 'active');
                      }}
                    >
                      {user.status === 'active' ? (
                        <>
                          <UserX className="mr-2 h-4 w-4" />
                          Pasifleştir
                        </>
                      ) : (
                        <>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Aktifleştir
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        onDelete(user.id);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

const UserForm = ({
  user,
  onSubmit,
  onCancel,
  isLoading,
}: {
  user?: User;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    email: user?.email ?? '',
    full_name: user?.full_name ?? '',
    role: user?.role ?? 'user',
    status: user?.status ?? 'active',
    phone: user?.phone ?? '',
    organization: user?.organization ?? '',
    permissions: user?.permissions ?? [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">E-posta *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
            }}
            required
          />
        </div>
        <div>
          <Label htmlFor="full_name">Ad Soyad *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => {
              setFormData({ ...formData, full_name: e.target.value });
            }}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="role">Rol</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => {
              setFormData({ ...formData, role: value as any });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Kullanıcı</SelectItem>
              <SelectItem value="moderator">Moderatör</SelectItem>
              <SelectItem value="admin">Yönetici</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Durum</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => {
              setFormData({ ...formData, status: value as any });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Pasif</SelectItem>
              <SelectItem value="suspended">Askıya Alınmış</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Telefon</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => {
              setFormData({ ...formData, phone: e.target.value });
            }}
          />
        </div>
        <div>
          <Label htmlFor="organization">Kurum</Label>
          <Input
            id="organization"
            value={formData.organization}
            onChange={(e) => {
              setFormData({ ...formData, organization: e.target.value });
            }}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          İptal
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Kaydediliyor...' : user ? 'Güncelle' : 'Oluştur'}
        </Button>
      </div>
    </form>
  );
};

// Main Component
export function UserManagementPageReal() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    new_this_month: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();

  // Load users
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await userManagementService.getUsers();
      setUsers(response.users);
      setStats(response.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kullanıcılar yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user creation/update
  const handleUserSubmit = async (data: UserFormData) => {
    try {
      if (editingUser) {
        await userManagementService.updateUser(editingUser.id, data);
        toast({ title: 'Kullanıcı güncellendi' });
      } else {
        await userManagementService.createUser(data);
        toast({ title: 'Kullanıcı oluşturuldu' });
      }
      setIsDialogOpen(false);
      setEditingUser(undefined);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kullanıcı kaydedilirken hata oluştu');
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    try {
      await userManagementService.deleteUser(userId);
      toast({ title: 'Kullanıcı silindi' });
      setDeleteUserId(null);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kullanıcı silinirken hata oluştu');
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (userId: string, newStatus: string) => {
    try {
      await userManagementService.updateUserStatus(userId, newStatus);
      toast({ title: 'Kullanıcı durumu güncellendi' });
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Durum güncellenirken hata oluştu');
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.organization?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    loadUsers();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kullanıcı Yönetimi</h1>
          <p className="text-gray-600">Sistem kullanıcılarını yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingUser(undefined);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Kullanıcı
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}</DialogTitle>
                <DialogDescription>
                  {editingUser ? 'Kullanıcı bilgilerini güncelleyin' : 'Yeni kullanıcı oluşturun'}
                </DialogDescription>
              </DialogHeader>
              <UserForm
                user={editingUser}
                onSubmit={handleUserSubmit}
                onCancel={() => {
                  setIsDialogOpen(false);
                }}
                isLoading={false}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setError(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <UserStatsCards stats={stats} />

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Kullanıcı ara..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Table */}
      <UserTable
        users={filteredUsers}
        onEdit={(user) => {
          setEditingUser(user);
          setIsDialogOpen(true);
        }}
        onDelete={setDeleteUserId}
        onToggleStatus={handleToggleStatus}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={Boolean(deleteUserId)}
        onOpenChange={() => {
          setDeleteUserId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kullanıcıyı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && handleDeleteUser(deleteUserId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
