import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminEnseignes from "../components/admin/AdminEnseignes";
import AdminFamilles from "../components/admin/AdminFamilles";
import { Skeleton } from "../components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useData } from "../context/data-context-utils";
import AdminAccountTypes from "./AdminAccountTypes";
import AdminCategories from "./AdminCategories";

function AdminReferences() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("categories");
  const dataContext = useData();
  const dataContextLoading = dataContext?.loading ?? true;

  useEffect(() => {
    const pathSegments = location.pathname.split("/");
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (lastSegment === "references" || lastSegment === "") {
      setActiveTab("categories");
      navigate("categories", { replace: true });
    } else if (lastSegment) {
      setActiveTab(lastSegment);
    }
  }, [location.pathname, navigate]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(value);
  };

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-2">
        Gestion des Référentiels
      </h1>
      {dataContextLoading ? (
        <Tabs value={activeTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="familles" disabled>
              <Skeleton className="h-4 w-32" />
            </TabsTrigger>
            <TabsTrigger value="enseignes" disabled>
              <Skeleton className="h-4 w-32" />
            </TabsTrigger>
            <TabsTrigger value="account_types" disabled>
              <Skeleton className="h-4 w-32" />
            </TabsTrigger>
            <TabsTrigger value="categories" disabled>
              <Skeleton className="h-4 w-32" />
            </TabsTrigger>
          </TabsList>
          <div className="mt-4">
            <Skeleton className="h-10 w-full mb-4" />{" "}
            {/* Search input skeleton */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                  <TableHead className="text-right">
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-16" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-between items-center mt-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </Tabs>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="familles">Familles</TabsTrigger>
            <TabsTrigger value="enseignes">Enseignes</TabsTrigger>
            <TabsTrigger value="account_types">Types de Compte</TabsTrigger>
            <TabsTrigger value="categories">Catégories de Charges</TabsTrigger>
          </TabsList>
          <TabsContent value="familles" className="mt-4">
            <AdminFamilles />
          </TabsContent>
          <TabsContent value="enseignes" className="mt-4">
            <AdminEnseignes />
          </TabsContent>
          <TabsContent value="account_types" className="mt-4">
            <AdminAccountTypes />
          </TabsContent>
          <TabsContent value="categories" className="mt-4">
            <AdminCategories />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default AdminReferences;
