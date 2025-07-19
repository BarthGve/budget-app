import { Users, Wifi } from "lucide-react";
import { useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { RecentSignupsChart } from "../components/admin/RecentSignupsChart";
import DashboardLayout from "../components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { useData } from "../context/data-context-utils";
import AdminReferences from "./AdminReferences";
import AdminUserProfile from "./AdminUserProfile";
import AdminUsers from "./AdminUsers";
import Help from "./Help";

const AdminDashboardContent: React.FC = () => {
  const dataContext = useData();
  const navigate = useNavigate();

  useEffect(() => {
    if (dataContext && !dataContext.loading) {
      if (
        !dataContext.user ||
        !dataContext.profile ||
        !dataContext.profile.is_admin
      ) {
        navigate("/login");
        return;
      }
    }
  }, [dataContext, navigate]);

  if (!dataContext) {
    return <div>Loading...</div>;
  }

  const {
    loading: dataLoading,
    allUsers,
    totalUserCount,
    recentSignups,
  } = dataContext;

  // Calculate online users based on last_seen_at
  const onlineUserCount = allUsers.filter((u) => {
    if (!u.profile?.last_seen_at) return false;
    const lastSeen = new Date(u.profile.last_seen_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
    return diffMinutes < 5; // Consider online if seen in the last 5 minutes
  }).length;

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">
        Tableau de bord Administrateur
      </h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Utilisateurs Inscrits
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-2xl font-bold">
                {totalUserCount !== null ? totalUserCount : "-"}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Nombre total d'utilisateurs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Utilisateurs en Ligne
            </CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-2xl font-bold">{onlineUserCount}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Utilisateurs actuellement connectés
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <RecentSignupsChart data={recentSignups} loading={dataLoading} />
      </div>
    </div>
  );
};

function AdminDashboard() {
  const dataContext = useData();
  const navigate = useNavigate();

  useEffect(() => {
    if (dataContext && !dataContext.loading) {
      if (
        !dataContext.user ||
        !dataContext.profile ||
        !dataContext.profile.is_admin
      ) {
        navigate("/login");
      }
    }
  }, [dataContext, navigate]);

  if (
    !dataContext ||
    dataContext.loading ||
    !dataContext.user ||
    !dataContext.profile ||
    !dataContext.profile.is_admin
  ) {
    return (
      <DashboardLayout isAdminDashboard={true}>
        <div className="flex flex-col space-y-3">
          <Skeleton className="h-[125px] w-[250px] rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout isAdminDashboard={true}>
      <Routes>
        <Route index element={<AdminDashboardContent />} />
        <Route path="references/*" element={<AdminReferences />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/:userId" element={<AdminUserProfile />} />
        <Route path="help" element={<Help />} />
      </Routes>
    </DashboardLayout>
  );
}

export default AdminDashboard;
