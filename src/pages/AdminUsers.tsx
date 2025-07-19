import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  User as UserIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DeleteUserDialog } from "../components/admin/DeleteUserDialog";
import { EditUserRoleDialog } from "../components/admin/EditUserRoleDialog";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Skeleton } from "../components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useData } from "../context/data-context-utils";

// Import the EnrichedUser type from the global types
import type { EnrichedUser } from "../types/index";

function AdminUsers() {
  const data = useData();
  const connectedUser = data?.user;
  const allUsers = useMemo(() => data?.allUsers || [], [data?.allUsers]); // Get allUsers from DataContext
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<EnrichedUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // États pour la recherche, le filtre et la pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(25);

  useEffect(() => {
    if (data?.loading === false) {
      setLoading(false);
    }
  }, [data?.loading]);

  const filteredUsers = useMemo(() => {
    return allUsers
      .filter((user) => {
        const searchLower = searchTerm.toLowerCase();
        const name = `${user.profile?.first_name || ""} ${
          user.profile?.last_name || ""
        }`.toLowerCase();
        const email = user.email?.toLowerCase() || "";
        return name.includes(searchLower) || email.includes(searchLower);
      })
      .filter((user) => {
        if (roleFilter === "all") return true;
        const isAdmin = user.profile?.is_admin || false;
        return roleFilter === "admin" ? isAdmin : !isAdmin;
      });
  }, [allUsers, searchTerm, roleFilter]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    return filteredUsers.slice(startIndex, startIndex + usersPerPage);
  }, [filteredUsers, currentPage, usersPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredUsers.length / usersPerPage);
  }, [filteredUsers, usersPerPage]);

  const handleUpdateSuccess = () => {
    // The DataContext will automatically update allUsers when the data changes
    // No local state management needed since we're using allUsers directly
  };

  const handleDeleteSuccess = () => {
    // The DataContext will automatically update allUsers when the data changes
    // No local state management needed since we're using allUsers directly
  };

  const UserRow = ({ user }: { user: EnrichedUser }) => {
    const handleNavigation = () => {
      navigate(`/admin-dashboard/users/${user.id}`);
    };

    return (
      <TableRow onClick={handleNavigation} className="cursor-pointer">
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user.profile?.avatar_url || undefined} />
              <AvatarFallback>
                {user.profile?.first_name?.[0] ||
                  user.email?.[0].toUpperCase() || <UserIcon />}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {user.profile?.first_name || ""} {user.profile?.last_name || ""}
              </div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          {user.profile?.is_admin ? (
            <Badge className="bg-orange-500 text-white hover:bg-orange-600">
              Admin
            </Badge>
          ) : (
            <Badge variant="secondary">Utilisateur</Badge>
          )}
        </TableCell>
        <TableCell className="text-muted-foreground">
          {new Date(user.created_at).toLocaleDateString("fr-FR")}
        </TableCell>
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => {
                  setEditingUser(user);
                  setIsModalOpen(true);
                }}
                disabled={user.id === connectedUser?.id}
              >
                Modifier
              </DropdownMenuItem>
              <DeleteUserDialog user={user} onSuccess={handleDeleteSuccess}>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-red-600"
                  disabled={user.id === connectedUser?.id}
                >
                  Supprimer
                </DropdownMenuItem>
              </DeleteUserDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  };

  const SkeletonRow = () => (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-[100px] rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-[80px]" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-8 w-8" />
      </TableCell>
    </TableRow>
  );

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Gestion des Utilisateurs</h1>

      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
          <div className="flex items-center gap-4 mt-4">
            <Input
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="admin">Administrateurs</SelectItem>
                <SelectItem value="user">Utilisateurs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Inscrit le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                  : paginatedUsers.map((user) => (
                      <UserRow key={user.id} user={user} />
                    ))}
              </TableBody>
            </Table>
          </div>
          {!loading && paginatedUsers.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Aucun utilisateur ne correspond à vos critères.
            </p>
          )}
        </CardContent>
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} sur {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </Card>

      <EditUserRoleDialog
        user={editingUser}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleUpdateSuccess}
      />
    </div>
  );
}

export default AdminUsers;
