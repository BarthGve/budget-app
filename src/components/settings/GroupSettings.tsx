import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import type { ControllerRenderProps } from "react-hook-form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type {
  Beneficiary,
  Group,
  GroupBeneficiary,
  User,
} from "../../types/index";

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
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LucideUser, MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { useData } from "../../context/data-context-utils";

const groupSchema = z.object({
  name: z.string().min(1, { message: "Le nom du groupe est requis." }),
  beneficiary_ids: z.array(z.string()).optional(), // Added for group beneficiaries
});

interface GroupSettingsProps {
  currentUser: User | null;
  groups: Group[];
  beneficiaries: Beneficiary[];
  loading: boolean;
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>; // Nouvelle prop
}

const GroupSettings: React.FC<GroupSettingsProps> = ({
  currentUser,
  groups,
  beneficiaries,
  loading,
  setGroups,
}) => {
  const data = useData();
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [currentStep, setCurrentStep] = useState(1); // Step for group form
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<
    Beneficiary[]
  >([]);

  const groupForm = useForm<z.infer<typeof groupSchema>>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
    },
  });

  if (!data) {
    return null; // Or a loading indicator, or throw an error
  }

  const { supabase } = data;

  // Group Handlers
  const handleAddGroupClick = () => {
    setEditingGroup(null);
    groupForm.reset({
      name: "",
      beneficiary_ids: [],
    });
    setSelectedBeneficiaries([]);
    setCurrentStep(1);
    setIsGroupDialogOpen(true);
  };

  const handleEditGroupClick = (group: Group) => {
    setEditingGroup(group);
    groupForm.reset(group);
    setSelectedBeneficiaries(
      group.group_beneficiaries
        .map((gb: GroupBeneficiary) =>
          beneficiaries.find((b) => b.id === gb.beneficiary_id)
        )
        .filter(Boolean) as Beneficiary[]
    );
    setCurrentStep(1);
    setIsGroupDialogOpen(true);
  };

  const onSubmitGroup = async (values: z.infer<typeof groupSchema>) => {
    if (!currentUser?.id) {
      toast.error("Vous devez être connecté pour gérer les groupes.");
      return;
    }

    let groupId = editingGroup?.id;

    if (editingGroup) {
      // Update group
      const { error } = await supabase
        .from("groups")
        .update({ name: values.name })
        .eq("id", editingGroup.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Groupe mis à jour avec succès !");
      // Mettre à jour l'état local des groupes
      setGroups((prev) =>
        prev.map((g) =>
          g.id === editingGroup.id
            ? {
                ...g,
                name: values.name,
                group_beneficiaries: selectedBeneficiaries.map((b) => ({
                  group_id: g.id,
                  beneficiary_id: b.id,
                })),
              }
            : g
        )
      );
    } else {
      // Insert group
      const { data, error } = await supabase
        .from("groups")
        .insert([{ name: values.name, user_id: currentUser.id }])
        .select();
      if (error) {
        toast.error(error.message);
        return;
      }
      if (data && data.length > 0) {
        groupId = data[0].id;
        toast.success("Groupe ajouté avec succès !");
        // Mettre à jour l'état local des groupes
        setGroups((prev) => [
          ...prev,
          {
            ...data[0],
            group_beneficiaries: selectedBeneficiaries.map((b) => ({
              group_id: data[0].id,
              beneficiary_id: b.id,
            })),
          },
        ]);
      } else {
        toast.error("Erreur lors de la création du groupe.");
        return;
      }
    }

    // Handle group_beneficiaries associations
    if (groupId) {
      // Ensure current user is a beneficiary in the database if selected
      const currentUserBeneficiaryInSelection = selectedBeneficiaries.find(
        (b) => b.id === currentUser?.id
      );
      if (currentUserBeneficiaryInSelection && currentUser) {
        const { error: upsertError } = await supabase
          .from("beneficiaries")
          .upsert(
            {
              id: currentUser.id,
              user_id: currentUser.id, // The user who created this beneficiary is themselves
              first_name: currentUser.user_metadata?.firstName || "Moi",
              last_name: currentUser.user_metadata?.lastName || "",
              avatar_url: currentUser.user_metadata?.avatar_url || null,
            },
            { onConflict: "id" }
          ); // Upsert based on ID

        if (upsertError) {
          toast.error(
            `Erreur lors de l'enregistrement de l'utilisateur comme bénéficiaire: ${upsertError.message}`
          );
          return;
        }
      }

      // Delete existing associations
      const { error: deleteError } = await supabase
        .from("group_beneficiaries")
        .delete()
        .eq("group_id", groupId);
      if (deleteError) {
        toast.error(
          `Erreur lors de la suppression des anciennes associations: ${deleteError.message}`
        );
        return;
      }

      // Insert new associations
      const newAssociations = selectedBeneficiaries.map((b) => ({
        group_id: groupId,
        beneficiary_id: b.id,
      }));

      if (newAssociations.length > 0) {
        const { error: insertError } = await supabase
          .from("group_beneficiaries")
          .insert(newAssociations);
        if (insertError) {
          toast.error(
            `Erreur lors de l'ajout des nouvelles associations: ${insertError.message}`
          );
          return;
        }
      }

      // Mettre à jour l'état local des groupes après les associations
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? {
                ...g,
                group_beneficiaries: selectedBeneficiaries.map((b) => ({
                  group_id: g.id,
                  beneficiary_id: b.id,
                })),
              }
            : g
        )
      );
    }

    setIsGroupDialogOpen(false);
    setEditingGroup(null);
    groupForm.reset();
    setSelectedBeneficiaries([]);
    setCurrentStep(1);
  };

  const handleDeleteGroup = async (groupId: string) => {
    const { error } = await supabase.from("groups").delete().eq("id", groupId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Groupe supprimé avec succès !");
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Mes Groupes</CardTitle>
        <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddGroupClick}>
              <Plus className="mr-2 h-4 w-4" /> Ajouter un groupe
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingGroup
                  ? "Modifier le groupe"
                  : "Ajouter un nouveau groupe"}
              </DialogTitle>
              <div className="text-sm text-muted-foreground">
                Étape {currentStep} sur 3
              </div>
            </DialogHeader>
            <Form {...groupForm}>
              <form
                onSubmit={groupForm.handleSubmit(onSubmitGroup)}
                className="space-y-4"
              >
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <FormField
                      control={groupForm.control}
                      name="name"
                      render={({
                        field,
                      }: {
                        field: ControllerRenderProps<
                          z.infer<typeof groupSchema>,
                          "name"
                        >;
                      }) => (
                        <FormItem>
                          <FormLabel>Nom du groupe</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      disabled={!groupForm.watch("name")}
                    >
                      Suivant
                    </Button>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Associer les bénéficiaires
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-md font-medium mb-2">
                          Bénéficiaires disponibles
                        </h4>
                        <div
                          className={`border rounded-md p-2 h-64 overflow-y-auto`}
                        >
                          {beneficiaries.filter(
                            (b: Beneficiary) =>
                              !selectedBeneficiaries.some(
                                (sb) => sb.id === b.id
                              )
                          ).length > 0 ? (
                            beneficiaries
                              .filter(
                                (b: Beneficiary) =>
                                  !selectedBeneficiaries.some(
                                    (sb) => sb.id === b.id
                                  )
                              )
                              .map((beneficiary: Beneficiary) => (
                                <div
                                  key={beneficiary.id}
                                  className="flex items-center p-2 mb-2 border rounded-md cursor-grab bg-white shadow-sm"
                                  draggable
                                  onDragStart={(e) =>
                                    e.dataTransfer.setData(
                                      "beneficiaryId",
                                      beneficiary.id
                                    )
                                  }
                                >
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarImage
                                      src={
                                        beneficiary.avatar_url ||
                                        "https://github.com/shadcn.png"
                                      }
                                      alt="Avatar"
                                    />
                                    <AvatarFallback>
                                      <LucideUser className="h-4 w-4" />
                                    </AvatarFallback>
                                  </Avatar>
                                  {beneficiary.first_name}{" "}
                                  {beneficiary.last_name}
                                </div>
                              ))
                          ) : (
                            <p className="text-center text-muted-foreground mt-4">
                              Aucun bénéficiaire disponible.
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-md font-medium mb-2">
                          Bénéficiaires du groupe
                        </h4>
                        <div
                          className="border rounded-md p-2 h-64 overflow-y-auto"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            const beneficiaryId =
                              e.dataTransfer.getData("beneficiaryId");
                            const beneficiaryToAdd = beneficiaries.find(
                              (b) => b.id === beneficiaryId
                            );
                            if (
                              beneficiaryToAdd &&
                              !selectedBeneficiaries.some(
                                (sb) => sb.id === beneficiaryToAdd.id
                              )
                            ) {
                              setSelectedBeneficiaries([
                                ...selectedBeneficiaries,
                                beneficiaryToAdd,
                              ]);
                            }
                          }}
                        >
                          {selectedBeneficiaries.length > 0 ? (
                            selectedBeneficiaries.map(
                              (beneficiary: Beneficiary) => (
                                <div
                                  key={beneficiary.id}
                                  className="flex items-center p-2 mb-2 border rounded-md cursor-pointer bg-white shadow-sm"
                                  onClick={() =>
                                    setSelectedBeneficiaries(
                                      selectedBeneficiaries.filter(
                                        (sb) => sb.id !== beneficiary.id
                                      )
                                    )
                                  }
                                >
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarImage
                                      src={
                                        beneficiary.avatar_url ||
                                        "https://github.com/shadcn.png"
                                      }
                                      alt="Avatar"
                                    />
                                    <AvatarFallback>
                                      <LucideUser className="h-4 w-4" />
                                    </AvatarFallback>
                                  </Avatar>
                                  {beneficiary.first_name}{" "}
                                  {beneficiary.last_name}
                                </div>
                              )
                            )
                          ) : (
                            <p className="text-center text-muted-foreground mt-4">
                              Déposez des bénéficiaires ici.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                      >
                        Précédent
                      </Button>
                      <Button type="button" onClick={() => setCurrentStep(3)}>
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Révision</h3>
                    <p>
                      <strong>Nom du groupe:</strong> {groupForm.watch("name")}
                    </p>
                    <p>
                      <strong>Bénéficiaires associés:</strong>
                    </p>
                    <ul className="list-disc pl-5">
                      {selectedBeneficiaries.length > 0 ? (
                        selectedBeneficiaries.map(
                          (beneficiary: Beneficiary) => (
                            <li key={beneficiary.id}>
                              {beneficiary.first_name} {beneficiary.last_name}
                            </li>
                          )
                        )
                      ) : (
                        <li>Aucun bénéficiaire associé.</li>
                      )}
                    </ul>
                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                      >
                        Précédent
                      </Button>
                      <Button type="submit">
                        {editingGroup ? "Mettre à jour" : "Ajouter"}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p>Chargement...</p>
          ) : groups.length > 0 ? (
            groups.map((group: Group) => (
              <Card key={group.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-md font-medium flex items-center gap-2">
                    {group.name}
                    <Badge
                      variant="outline"
                      className="bg-yellow-100 text-yellow-800"
                    >
                      {group.group_beneficiaries.length}
                    </Badge>
                  </CardTitle>
                  <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Ouvrir le menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEditGroupClick(group)}
                        >
                          Modifier
                        </DropdownMenuItem>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem className="text-red-500">
                            Supprimer
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Êtes-vous sûr de vouloir supprimer ce groupe ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible et supprimera
                          définitivement ce groupe et toutes ses associations
                          avec les bénéficiaires.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteGroup(group.id)}
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {group.group_beneficiaries.length > 0 ? (
                      group.group_beneficiaries.map((gb: GroupBeneficiary) => {
                        const beneficiary = beneficiaries.find(
                          (b) => b.id === gb.beneficiary_id
                        );
                        return beneficiary ? (
                          <div
                            key={beneficiary.id}
                            className="flex items-center space-x-2 border rounded-full pr-3 bg-gray-50"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={
                                  beneficiary.avatar_url ||
                                  "https://github.com/shadcn.png"
                                }
                                alt={beneficiary.first_name}
                              />
                              <AvatarFallback>
                                {beneficiary.last_name?.[0] ?? ""}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {beneficiary.first_name} {beneficiary.last_name}
                            </span>
                          </div>
                        ) : null;
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Aucun bénéficiaire associé.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center col-span-full">Aucun groupe trouvé.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupSettings;
