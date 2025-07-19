import BeneficiarySettings from "@/components/settings/BeneficiarySettings";
import GroupSettings from "@/components/settings/GroupSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { useData } from "../context/data-context-utils";

const DASHBOARD_CARDS = [
  { key: "showIncomeSummary", label: "Revenu Mensuel Total" },
  { key: "showCreditSummary", label: "Crédits Mensuels" },
  { key: "showRecurringChargesSummary", label: "Charges Mensuelles" },
  { key: "showSavingsSummary", label: "Épargne Mensuelle" },
  { key: "showBeneficiaryCharges", label: "Charges par Bénéficiaires" },
  { key: "showGroupCharges", label: "Charges par Groupe" },
  {
    key: "showCategoryChargesDonut",
    label: "Répartition des Charges par Catégorie",
  },
  { key: "showCreditCategoriesDonut", label: "Répartition des Crédits" },
];

function Settings() {
  const data = useData();

  const [dashboardPreferences, setDashboardPreferences] = useState(() => {
    // Initialiser avec les valeurs par défaut ou celles du profil si elles existent
    const defaultPreferences = DASHBOARD_CARDS.reduce((acc, card) => {
      acc[card.key] = true; // Toutes les cartes sont affichées par défaut
      return acc;
    }, {} as Record<string, boolean>);
    return defaultPreferences;
  });

  useEffect(() => {
    if (data?.profile?.dashboard_preferences) {
      setDashboardPreferences((prev) => ({
        ...prev,
        ...data.profile?.dashboard_preferences,
      }));
    }
  }, [data?.profile?.dashboard_preferences]);

  const handlePreferenceChange = useCallback(
    async (cardKey: string, checked: boolean) => {
      setDashboardPreferences((prev) => {
        const newPreferences = { ...prev, [cardKey]: checked };
        // Sauvegarder dans Supabase
        if (data?.user?.id && data?.supabase) {
          data.supabase
            .from("profiles")
            .update({ dashboard_preferences: newPreferences })
            .eq("id", data.user.id)
            .then(({ error }) => {
              if (error) {
                toast.error(
                  `Erreur lors de la sauvegarde des préférences: ${error.message}`
                );
              } else {
                toast.success("Préférences du tableau de bord sauvegardées !");
                // Mettre à jour le profil localement pour éviter le rechargement complet
                if (data.profile) {
                  data.setProfile({
                    ...data.profile,
                    dashboard_preferences: newPreferences,
                  });
                }
              }
            });
        }
        return newPreferences;
      });
    },
    [data]
  );

  const handleToggleAllCards = useCallback(
    async (checked: boolean) => {
      const newPreferences = DASHBOARD_CARDS.reduce((acc, card) => {
        acc[card.key] = checked;
        return acc;
      }, {} as Record<string, boolean>);

      setDashboardPreferences(newPreferences);

      if (data?.user?.id && data?.supabase) {
        data.supabase
          .from("profiles")
          .update({ dashboard_preferences: newPreferences })
          .eq("id", data.user.id)
          .then(({ error }) => {
            if (error) {
              toast.error(
                `Erreur lors de la sauvegarde des préférences: ${error.message}`
              );
            } else {
              toast.success("Préférences du tableau de bord sauvegardées !");
              if (data.profile) {
                data.setProfile({
                  ...data.profile,
                  dashboard_preferences: newPreferences,
                });
              }
            }
          });
      }
    },
    [data]
  );

  const currentUser = data?.user;
  const beneficiaries = useMemo(
    () => data?.beneficiaries || [],
    [data?.beneficiaries]
  );
  const groups = data?.groups || [];
  const loading = data?.loading || false;

  const userAsBeneficiary = useMemo(() => {
    if (!currentUser) return null;
    return {
      id: currentUser.id,
      created_at: new Date().toISOString(),
      user_id: currentUser.id,
      first_name: (currentUser.user_metadata?.firstName as string) || "Moi",
      last_name: (currentUser.user_metadata?.lastName as string) || "",
      avatar_url: (currentUser.user_metadata?.avatar_url as string) || null,
    };
  }, [currentUser]);

  const combinedBeneficiaries = useMemo(() => {
    if (!userAsBeneficiary) return beneficiaries;
    const isUserAlreadyBeneficiary = beneficiaries.some(
      (b) => b.id === userAsBeneficiary.id
    );
    return isUserAlreadyBeneficiary
      ? beneficiaries
      : [userAsBeneficiary, ...beneficiaries];
  }, [beneficiaries, userAsBeneficiary]);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Chargement des paramètres...
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Chargement des paramètres...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Vous devez être connecté pour accéder à cette page.
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Paramètres</h1>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="dashboard">Tableau de Bord</TabsTrigger>
          <TabsTrigger value="beneficiaries">
            Gérer les Bénéficiaires
          </TabsTrigger>
          <TabsTrigger value="groups">Gérer les Groupes</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="mt-4 text-muted-foreground">
            Les paramètres généraux sont gérés sur la page de profil.
          </div>
        </TabsContent>

        <TabsContent value="dashboard">
          <Card className="mt-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Personnalisation des cartes du Tableau de Bord
              </CardTitle>
              <Switch
                checked={Object.values(dashboardPreferences).every(Boolean)}
                onCheckedChange={handleToggleAllCards}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              {DASHBOARD_CARDS.map((card) => (
                <div
                  key={card.key}
                  className="flex items-center justify-between"
                >
                  <Label htmlFor={card.key}>{card.label}</Label>
                  <Switch
                    id={card.key}
                    checked={dashboardPreferences[card.key]}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange(card.key, checked)
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bénéficiaires Tab */}
        <TabsContent value="beneficiaries" className="mt-4">
          <BeneficiarySettings
            currentUser={currentUser}
            beneficiaries={combinedBeneficiaries}
            groups={groups}
            loading={loading}
            setBeneficiaries={data.setBeneficiaries}
          />
        </TabsContent>

        {/* Groupes Tab */}
        <TabsContent value="groups" className="mt-4">
          <GroupSettings
            currentUser={currentUser}
            groups={groups}
            beneficiaries={beneficiaries}
            loading={loading}
            setGroups={data.setGroups}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Settings;
