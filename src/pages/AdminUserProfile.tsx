import {
  ArrowLeft,
  Briefcase,
  Handshake,
  Landmark,
  PiggyBank,
  Users,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
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
import { Skeleton } from "../components/ui/skeleton";
import { useData } from "../context/data-context-utils";
import { supabase } from "../lib/supabaseClient";
import { formatCurrency } from "../lib/utils";
import type { EnrichedUser } from "../types/index";

// Définition des types pour les données de l'utilisateur
interface UserProfile {
  id: string;
  email?: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
}

interface UserStats {
  recurring_charges: { count: number; total_monthly: number };
  credits: { count: number; total_due: number };
  savings: { count: number; total_saved: number };
  incomes: { count: number; total_monthly: number };
}

interface Beneficiary {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
}

interface CollaborationPartner {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface UserDetails {
  profile: UserProfile;
  stats: UserStats;
  beneficiaries: Beneficiary[];
  active_collaborations: CollaborationPartner[];
}

function AdminUserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const data = useData();
  const connectedUser = data?.user;
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUserDetails = useCallback(async () => {
    if (!supabase || !userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        `get-user-details/${userId}`
      );
      if (error) throw error;
      setUserDetails(data);
    } catch (error: unknown) {
      console.error("Error fetching user details:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue";
      toast.error(
        "Erreur lors de la récupération des détails de l'utilisateur: " +
          errorMessage
      );
      navigate("/admin-dashboard/users"); // Rediriger si l'utilisateur n'est pas trouvé
    } finally {
      setLoading(false);
    }
  }, [userId, navigate]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const handleDeleteSuccess = () => {
    navigate("/admin-dashboard/users");
  };

  const handleUpdateSuccess = (updatedUser: EnrichedUser) => {
    // Update the userDetails with the new admin status
    if (userDetails && updatedUser.profile) {
      setUserDetails({
        ...userDetails,
        profile: {
          ...userDetails.profile,
          is_admin: updatedUser.profile.is_admin,
        },
      });
    }
  };

  if (loading) {
    return <UserProfileSkeleton />;
  }

  if (!userDetails) {
    return (
      <div className="text-center">
        <p>Impossible de charger les informations de l'utilisateur.</p>
        <Button
          onClick={() => navigate("/admin-dashboard/users")}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la liste
        </Button>
      </div>
    );
  }

  const { profile, stats, beneficiaries, active_collaborations } = userDetails;

  return (
    <div className="space-y-8">
      {/* En-tête avec actions */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => navigate("/admin-dashboard/users")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la liste
        </Button>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsModalOpen(true)}
            disabled={profile.id === connectedUser?.id}
          >
            Modifier le rôle
          </Button>
          <DeleteUserDialog user={profile} onSuccess={handleDeleteSuccess}>
            <Button
              variant="destructive"
              disabled={profile.id === connectedUser?.id}
            >
              Supprimer l'utilisateur
            </Button>
          </DeleteUserDialog>
        </div>
      </div>

      {/* En-tête du profil */}
      <Card>
        <CardContent className="pt-6 flex flex-col md:flex-row items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-3xl">
              {profile.first_name?.[0] || profile.email?.[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-grow text-center md:text-left">
            <h1 className="text-3xl font-bold">
              {profile.first_name} {profile.last_name}
            </h1>
            <p className="text-muted-foreground">{profile.email}</p>
            <p className="text-sm text-muted-foreground">
              Inscrit le:{" "}
              {new Date(profile.created_at).toLocaleDateString("fr-FR")}
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2">
            <Badge className="bg-orange-500 text-white hover:bg-orange-600">
              {profile.is_admin ? "Administrateur" : "Utilisateur"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Cartes de synthèse */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<Briefcase />}
          title="Charges Récurrentes"
          value={stats.recurring_charges.count}
          description={`${formatCurrency(
            stats.recurring_charges.total_monthly
          )} / mois`}
        />
        <SummaryCard
          icon={<Landmark />}
          title="Crédits"
          value={stats.credits.count}
          description={`${formatCurrency(stats.credits.total_due)} restant dû`}
        />
        <SummaryCard
          icon={<PiggyBank />}
          title="Épargne"
          value={stats.savings.count}
          description={`${formatCurrency(stats.savings.total_saved)} au total`}
        />
        <SummaryCard
          icon={<Handshake />}
          title="Revenus"
          value={stats.incomes.count}
          description={`${formatCurrency(stats.incomes.total_monthly)} / mois`}
        />
      </div>

      {/* Cartes de détails */}
      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Handshake className="mr-2" /> Collaborations Actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            {active_collaborations.length > 0 ? (
              <ul className="space-y-4">
                {active_collaborations.map((partner) => (
                  <li key={partner.id} className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={partner.avatar_url || undefined} />
                      <AvatarFallback>{partner.first_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {partner.first_name} {partner.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {partner.email}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">
                Aucune collaboration active.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2" /> Bénéficiaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            {beneficiaries.length > 0 ? (
              <ul className="space-y-4">
                {beneficiaries.map((beneficiary) => (
                  <li key={beneficiary.id} className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={beneficiary.avatar_url || undefined} />
                      <AvatarFallback>
                        {beneficiary.first_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium">
                      {beneficiary.first_name} {beneficiary.last_name}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">Aucun bénéficiaire créé.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <EditUserRoleDialog
        user={
          userDetails
            ? {
                id: userDetails.profile.id,
                email: userDetails.profile.email || "",
                created_at: userDetails.profile.created_at,
                profile: {
                  id: userDetails.profile.id,
                  first_name: userDetails.profile.first_name || "",
                  last_name: userDetails.profile.last_name || "",
                  avatar_url: userDetails.profile.avatar_url || "",
                  is_admin: userDetails.profile.is_admin,
                  last_seen_at: "",
                },
              }
            : null
        }
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleUpdateSuccess}
      />
    </div>
  );
}

// Composant pour la carte de synthèse
const SummaryCard = ({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  description: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

// Composant pour le skeleton de la page
const UserProfileSkeleton = () => (
  <div className="p-8 space-y-8">
    <Skeleton className="h-10 w-48" />
    <Card>
      <CardContent className="pt-6 flex flex-col md:flex-row items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="flex-grow space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </CardContent>
    </Card>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-40 mt-1" />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    </div>
  </div>
);

export default AdminUserProfile;
