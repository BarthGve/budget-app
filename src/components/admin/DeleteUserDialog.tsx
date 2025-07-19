import React from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';

interface User {
  id: string;
  email?: string;
}

interface DeleteUserDialogProps {
  user: User;
  onSuccess: (userId: string) => void;
  children: React.ReactNode;
}

export function DeleteUserDialog({
  user,
  onSuccess,
  children,
}: DeleteUserDialogProps) {
  const handleDelete = async () => {
    try {
      const { error } = await supabase.functions.invoke('manage-users', {
        method: 'POST',
        body: {
          action: 'DELETE_USER',
          payload: { userId: user.id },
        },
      });

      if (error) {
        throw error;
      }

      toast.success('Utilisateur supprimé avec succès.');
      onSuccess(user.id);
    } catch (error: unknown) {
      let errorMessage = 'Une erreur inconnue est survenue.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(`Erreur lors de la suppression: ${errorMessage}`);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous absolument sûr?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Elle supprimera définitivement
            l'utilisateur {user.email} et toutes ses données associées.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
