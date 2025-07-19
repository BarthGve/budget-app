import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Send, HeartHandshake, Mailbox } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../ui/alert-dialog";
import type { Collaboration } from "../../types";

interface CollaborationListItemProps {
  collaboration: Collaboration;
  currentUserId: string;
  onAcceptReject: (collabId: string, status: "accepted" | "rejected") => void;
  onCancel: (collabId: string) => void;
  onEnd: (collabId: string) => void;
}

export const CollaborationListItem: React.FC<CollaborationListItemProps> = ({
  collaboration,
  currentUserId,
  onAcceptReject,
  onCancel,
  onEnd,
}) => {
  const isInviter = collaboration.inviter_id === currentUserId;
  const collaborator = isInviter
    ? collaboration.invitee
    : collaboration.inviter;

  const getStatusBadge = () => {
    switch (collaboration.status) {
      case "pending":
        return isInviter ? (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 flex items-center gap-1"
          >
            <Send className="h-3 w-3" /> Envoyée
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 flex items-center gap-1"
          >
            <Mailbox className="h-3 w-3" /> Reçue
          </Badge>
        );
      case "accepted":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 flex items-center gap-1"
          >
            <HeartHandshake className="h-3 w-3" /> Active
          </Badge>
        );
      case "rejected":
        return <Badge variant="destructive">Refusée</Badge>;
      default:
        return null;
    }
  };

  const getCollaboratorDisplayName = () => {
    return collaborator?.first_name && collaborator?.last_name
      ? `${collaborator.first_name} ${collaborator.last_name}`
      : collaborator?.email;
  };

  return (
    <div className="flex items-center justify-between p-2 ">
      <div className="flex items-center gap-3">
        <Avatar className="h-6 w-6">
          <AvatarImage
            src={collaborator?.avatar_url || "https://github.com/shadcn.png"}
          />
          <AvatarFallback>
            {getCollaboratorDisplayName()?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">
          {getCollaboratorDisplayName()}
        </span>
        {getStatusBadge()}
      </div>

      {collaboration.status === "pending" && isInviter && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline">
              Annuler
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Annuler cette invitation ?</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir annuler cette invitation ? Cette action
                est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Non, garder l'invitation</AlertDialogCancel>
              <AlertDialogAction onClick={() => onCancel(collaboration.id)}>
                Oui, annuler
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {collaboration.status === "pending" && !isInviter && (
        <div className="space-x-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm">Accepter</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Accepter cette invitation ?</AlertDialogTitle>
                <AlertDialogDescription>
                  En acceptant cette invitation, vous autorisez cet utilisateur
                  à collaborer avec vous.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onAcceptReject(collaboration.id, "accepted")}
                >
                  Accepter
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAcceptReject(collaboration.id, "rejected")}
          >
            Refuser
          </Button>
        </div>
      )}

      {collaboration.status === "accepted" && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="destructive">
              Mettre fin
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Êtes-vous sûr de vouloir mettre fin à cette collaboration ?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible et supprimera cette collaboration
                de vos enregistrements.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => onEnd(collaboration.id)}>
                Mettre fin
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};
