import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../../context/data-context-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

function AdminPrompt() {
  const data = useData();
  const navigate = useNavigate();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Attendre que le contexte de données soit chargé
    if (!data) {
      return;
    }
    const { profile, user, loading } = data;

    // Ne rien faire si les données sont en cours de chargement ou si l'utilisateur/profil n'est pas défini
    if (loading || !user || !profile) {
      return;
    }

    // Si l'utilisateur n'est plus admin, s'assurer que l'indicateur est supprimé
    if (!profile.is_admin && sessionStorage.getItem("adminPromptShown")) {
      sessionStorage.removeItem("adminPromptShown");
    }

    const hasBeenPrompted = sessionStorage.getItem("adminPromptShown");

    // Afficher la boîte de dialogue si l'utilisateur est admin et n'a pas encore été notifié
    if (profile.is_admin && !hasBeenPrompted) {
      setShowPrompt(true);
      sessionStorage.setItem("adminPromptShown", "true");
    }
  }, [data, navigate]);

  const handleGoToAdminDashboard = () => {
    setShowPrompt(false);
    navigate("/admin-dashboard");
  };

  const handleClose = () => {
    setShowPrompt(false);
  };

  // Ne pas rendre la boîte de dialogue si elle ne doit pas être affichée ou si le profil est manquant
  if (!showPrompt || !data?.profile) {
    return null;
  }

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent onEscapeKeyDown={handleClose}>
        <DialogHeader>
          <DialogTitle>Bienvenue, {data.profile.first_name || 'Admin'} !</DialogTitle>
          <DialogDescription>
            Vous avez des privilèges d'administrateur. Souhaitez-vous accéder au tableau de bord d'administration ?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={handleClose}>
            Rester sur le tableau de bord
          </Button>
          <Button onClick={handleGoToAdminDashboard}>
            Aller au tableau de bord admin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AdminPrompt;
