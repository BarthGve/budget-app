import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "../../lib/supabaseClient";
import type { EnrichedUser } from "../../types/index";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

interface EditUserRoleDialogProps {
  user: EnrichedUser | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: (updatedUser: EnrichedUser) => void;
}

export function EditUserRoleDialog({
  user,
  isOpen,
  onOpenChange,
  onSuccess,
}: EditUserRoleDialogProps) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      setIsAdmin(user.profile?.is_admin || false);
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const handleUpdateUserRole = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        method: "POST",
        body: {
          action: "UPDATE_ROLE",
          payload: {
            userId: user.id,
            isAdmin: isAdmin,
          },
        },
      });

      if (error) {
        throw error;
      }

      const updatedUser: EnrichedUser = {
        ...user,
        profile: { ...user.profile!, is_admin: data.user.is_admin },
      };
      onSuccess(updatedUser);
      toast.success("Rôle de l'utilisateur mis à jour.");
    } catch (error: unknown) {
      let errorMessage = "Une erreur inconnue est survenue.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(`Erreur lors de la mise à jour: ${errorMessage}`);
    } finally {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le rôle de l'utilisateur</DialogTitle>
          <DialogDescription>
            Changer le statut administrateur pour {user.email}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 py-4">
          <Switch
            id="admin-switch"
            checked={isAdmin}
            onCheckedChange={setIsAdmin}
          />
          <Label htmlFor="admin-switch">Administrateur</Label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleUpdateUserRole}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
