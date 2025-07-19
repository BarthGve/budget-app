import { EntityLogo } from "../ui/EntityLogo";
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
} from "../ui/alert-dialog";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { Progress } from "../ui/progress";
import { TableCell, TableRow } from "../ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

import { CheckCircle, MoreHorizontal, Share2 } from "lucide-react";
import type { Credit } from "../../types";
import { Button } from "../ui/button";

interface CreditListItemProps {
  credit: Credit;
  onEditClick: (credit: Credit) => void;
  onDelete: (creditId: string) => void;
  onSettle: (creditId: string) => void;
  currentUserId: string | null;
  onToggleShare: (creditId: string, isShared: boolean) => void;
}

export function CreditListItem({
  credit,
  onEditClick,
  onDelete,
  onSettle,
  currentUserId,
  onToggleShare,
}: CreditListItemProps) {
  return (
    <TableRow key={credit.id}>
      <TableCell className="flex items-center gap-2">
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="flex items-center gap-2">
              {credit.is_shared && credit.remaining_installments > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Share2
                        className={`h-4 w-4 ${
                          credit.user_id === currentUserId
                            ? "text-muted-foreground"
                            : "text-blue-500"
                        }`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {credit.user_id === currentUserId
                          ? "Partagé par vous"
                          : `Partagé par ${
                              credit.profiles?.first_name || "un collaborateur"
                            }`}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <EntityLogo
                logoUrl={credit.enseignes?.external_logo_url}
                altText={`${credit.enseignes?.name || credit.loan_name} logo`}
                fallbackIcon={<Share2 className="w-5 h-5 text-gray-400" />}
              />
              <span className="font-semibold text-sm">{credit.loan_name}</span>
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="bg-white p-4 rounded-md shadow-lg max-w-xs text-sm text-gray-800">
            <p className="font-semibold text-base mb-2 flex items-center gap-2">
              <EntityLogo
                logoUrl={credit.enseignes?.external_logo_url}
                altText={`${credit.enseignes?.name || credit.loan_name} logo`}
                fallbackIcon={<Share2 className="w-5 h-5 text-gray-400" />}
              />
              {credit.loan_name}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <p>Montant total:</p>
              <p className="font-medium text-right">
                {credit.total_amount.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                })}
              </p>
              <p>Mensualité:</p>
              <p className="font-medium text-right">
                {credit.monthly_payment.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                })}
              </p>
              <p>Taux d'intérêt:</p>
              <p className="font-medium text-right">
                {(credit.interest_rate * 100).toFixed(2)}%
              </p>
              <p>Échéances payées:</p>
              <p className="font-medium text-right">
                {credit.total_installments - credit.remaining_installments} /{" "}
                {credit.total_installments}
              </p>
              <p>Reste dû:</p>
              <p className="font-medium text-right">
                {credit.current_amount_due.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                })}
              </p>
              <p>Date de début:</p>
              <p className="font-medium text-right">
                {new Date(credit.start_date).toLocaleDateString("fr-FR")}
              </p>
              {credit.end_date && (
                <>
                  <p>Date de fin:</p>
                  <p className="font-medium text-right">
                    {new Date(credit.end_date).toLocaleDateString("fr-FR")}
                  </p>
                </>
              )}
              {credit.is_settled_early && credit.end_date && (
                <>
                  <p>Soldé le:</p>
                  <p className="font-medium text-right text-green-600">
                    {new Date(credit.end_date).toLocaleDateString("fr-FR")}
                  </p>
                </>
              )}
            </div>
          </HoverCardContent>
        </HoverCard>
      </TableCell>
      <TableCell>
        {credit.total_amount.toLocaleString("fr-FR", {
          style: "currency",
          currency: "EUR",
        })}
      </TableCell>
      <TableCell>
        Mensualité:{" "}
        {credit.monthly_payment.toLocaleString("fr-FR", {
          style: "currency",
          currency: "EUR",
        })}
      </TableCell>
      <TableCell className="w-1/3">
        {credit.remaining_installments <= 0 ? (
          <Badge variant="outline">Soldé</Badge>
        ) : (
          <Progress
            value={
              ((credit.total_installments - credit.remaining_installments) /
                credit.total_installments) *
              100
            }
            className="w-full bg-green-100 [&>div]:bg-green-500"
          />
        )}
      </TableCell>
      <TableCell className="text-center">
        {credit.is_settled_early && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                  <CheckCircle className="h-4 w-4" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Soldé par anticipation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </TableCell>
      <TableCell className="text-right">
        {credit.remaining_installments > 0 && (
          <div
            onMouseEnter={(e) => e.stopPropagation()}
            onMouseLeave={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Ouvrir le menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClick(credit);
                  }}
                  disabled={credit.user_id !== currentUserId}
                >
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleShare(credit.id, !credit.is_shared);
                  }}
                  disabled={credit.user_id !== currentUserId}
                >
                  {credit.is_shared ? "Ne plus partager" : "Partager"}
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      className="text-green-600"
                      onSelect={(e) => e.preventDefault()} // Prevent closing dropdown
                      disabled={credit.user_id !== currentUserId}
                    >
                      Solder le crédit
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Êtes-vous sûr de vouloir solder ce crédit ?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action marquera le crédit comme entièrement
                        remboursé à la date d'aujourd'hui. Il sera déplacé dans
                        les archives.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onSettle(credit.id)}>
                        Confirmer et Solder
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      className="text-red-500"
                      onSelect={(e) => e.preventDefault()} // Prevent closing dropdown
                      disabled={credit.user_id !== currentUserId}
                    >
                      Supprimer
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Êtes-vous sûr de vouloir supprimer ce crédit ?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible et supprimera
                        définitivement ce crédit de vos enregistrements.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(credit.id)}>
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
