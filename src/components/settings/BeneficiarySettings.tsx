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
import { zodResolver } from "@hookform/resolvers/zod";
import { LucideUser, MoreHorizontal, Plus, Upload } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import type { ControllerRenderProps } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useData } from "../../context/data-context-utils";
import type {
  Beneficiary,
  Group,
  GroupBeneficiary,
  User,
} from "../../types/index";
import { Separator } from "../ui/separator";

const beneficiarySchema = z.object({
  first_name: z.string().min(1, { message: "Le prénom est requis." }),
  last_name: z.string().nullable().optional(),
  avatar_url: z
    .string()
    .url({ message: "URL d'avatar invalide." })
    .nullable()
    .optional()
    .or(z.literal("")),
});

interface BeneficiarySettingsProps {
  currentUser: User | null;
  beneficiaries: Beneficiary[];
  groups: Group[];
  loading: boolean;
  setBeneficiaries: React.Dispatch<React.SetStateAction<Beneficiary[]>>; // Nouvelle prop
}

const BeneficiarySettings: React.FC<BeneficiarySettingsProps> = ({
  currentUser,
  beneficiaries,
  groups,
  loading,
  setBeneficiaries,
}) => {
  const data = useData();
  const [isBeneficiaryDialogOpen, setIsBeneficiaryDialogOpen] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] =
    useState<Beneficiary | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const beneficiaryForm = useForm<z.infer<typeof beneficiarySchema>>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      avatar_url: "",
    },
  });

  const handleFileChange = useCallback(
    async (file: File | null) => {
      if (!file || !currentUser?.id || !data?.supabase) return;

      setUploadingAvatar(true);
      try {
        if (!file.type.startsWith("image/")) {
          toast.error("Le fichier doit être une image.");
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          // 5MB limit
          toast.error("L'image est trop grande (max 5MB).");
          return;
        }

        const optimizedFile = await new Promise<File>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const MAX_WIDTH = 200;
              const MAX_HEIGHT = 200;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }
              canvas.width = width;
              canvas.height = height;

              const ctx = canvas.getContext("2d");
              ctx?.drawImage(img, 0, 0, width, height);

              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    resolve(
                      new File([blob], file.name, {
                        type: "image/jpeg",
                        lastModified: Date.now(),
                      })
                    );
                  } else {
                    toast.error("Erreur lors de l'optimisation de l'image.");
                    setUploadingAvatar(false);
                  }
                },
                "image/jpeg",
                0.8
              );
            };
            img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
        });

        const fileExt = optimizedFile.name.split(".").pop();
        const fileName = `${
          currentUser.id
        }/beneficiary_avatars/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await data.supabase.storage
          .from("avatars") // Using the same 'avatars' bucket, but with a subfolder
          .upload(fileName, optimizedFile, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          toast.error(`Erreur d'upload: ${uploadError.message}`);
          return;
        }

        const { data: publicUrlData } = data.supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        if (publicUrlData.publicUrl) {
          beneficiaryForm.setValue("avatar_url", publicUrlData.publicUrl);
          toast.success("Avatar chargé avec succès !");
        } else {
          toast.error("Impossible d'obtenir l'URL publique de l'avatar.");
        }
      } catch (error: unknown) {
        toast.error(
          `Une erreur inattendue est survenue: ${(error as Error).message}`
        );
      } finally {
        setUploadingAvatar(false);
      }
    },
    [currentUser, beneficiaryForm, data, setUploadingAvatar]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileChange(e.dataTransfer.files[0]);
      }
    },
    [handleFileChange, setIsDragging]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
    },
    [setIsDragging]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);

  // Beneficiary Handlers
  const handleAddBeneficiaryClick = () => {
    setEditingBeneficiary(null);
    beneficiaryForm.reset({
      first_name: "",
      last_name: "",
      avatar_url: "",
    });
    setIsBeneficiaryDialogOpen(true);
  };

  const handleEditBeneficiaryClick = useCallback(
    (beneficiary: Beneficiary) => {
      setEditingBeneficiary(beneficiary);
      beneficiaryForm.reset(beneficiary);
      setIsBeneficiaryDialogOpen(true);
    },
    [beneficiaryForm, setIsBeneficiaryDialogOpen, setEditingBeneficiary]
  );

  const onSubmitBeneficiary = useCallback(
    async (values: z.infer<typeof beneficiarySchema>) => {
      if (!currentUser?.id || !data?.supabase) {
        toast.error("Vous devez être connecté pour gérer les bénéficiaires.");
        return;
      }

      if (editingBeneficiary) {
        // Update logic
        const { error } = await data.supabase
          .from("beneficiaries")
          .update(values)
          .eq("id", editingBeneficiary.id);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Bénéficiaire mis à jour avec succès ! ");
          setBeneficiaries((prev) => {
            console.log("Beneficiaries before update:", prev);
            const updated = prev.map((b) =>
              b.id === editingBeneficiary.id ? { ...b, ...values } : b
            );
            console.log("Beneficiaries after update:", updated);
            return updated;
          });
          beneficiaryForm.reset();
          setIsBeneficiaryDialogOpen(false);
          setEditingBeneficiary(null);
        }
      } else {
        // Insert logic
        const { data: newBeneficiary, error } = await data.supabase
          .from("beneficiaries")
          .insert([{ ...values, user_id: currentUser.id }])
          .select();
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Bénéficiaire ajouté avec succès ! ");
          if (newBeneficiary) {
            setBeneficiaries((prev) => {
              console.log("Beneficiaries before add:", prev);
              const updated = [...prev, newBeneficiary[0]];
              console.log("Beneficiaries after add:", updated);
              return updated;
            });
          }
          beneficiaryForm.reset();
          setIsBeneficiaryDialogOpen(false);
          setEditingBeneficiary(null);
        }
      }
      beneficiaryForm.reset();
    },
    [
      currentUser,
      editingBeneficiary,
      setBeneficiaries,
      beneficiaryForm,
      setIsBeneficiaryDialogOpen,
      setEditingBeneficiary,
      data,
    ]
  );

  const handleDeleteBeneficiary = useCallback(
    async (beneficiaryId: string) => {
      if (!data?.supabase) return;

      const { error } = await data.supabase
        .from("beneficiaries")
        .delete()
        .eq("id", beneficiaryId);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Bénéficiaire supprimé avec succès ! ");
        setBeneficiaries((prev) => {
          console.log("Beneficiaries before delete:", prev);
          const updated = prev.filter((b) => b.id !== beneficiaryId);
          console.log("Beneficiaries after delete:", updated);
          return updated;
        });
      }
    },
    [setBeneficiaries, data]
  );

  if (!data) {
    return null; // Ou un indicateur de chargement, ou lancer une erreur
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Mes Bénéficiaires</CardTitle>
        <Dialog
          open={isBeneficiaryDialogOpen}
          onOpenChange={setIsBeneficiaryDialogOpen}
        >
          <DialogTrigger asChild>
            <Button onClick={handleAddBeneficiaryClick}>
              <Plus className="mr-2 h-4 w-4" /> Ajouter un bénéficiaire
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingBeneficiary
                  ? "Modifier le bénéficiaire"
                  : "Ajouter un nouveau bénéficiaire"}
              </DialogTitle>
            </DialogHeader>
            <Form {...beneficiaryForm}>
              <form
                onSubmit={beneficiaryForm.handleSubmit(onSubmitBeneficiary)}
                className="space-y-4"
              >
                <div className="flex flex-col items-center mb-4">
                  <div
                    className={`relative rounded-full overflow-hidden cursor-pointer border-2 ${
                      isDragging ? "border-blue-500" : "border-gray-300"
                    } transition-colors duration-200`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Avatar className="h-24 w-24">
                      <AvatarImage
                        src={
                          beneficiaryForm.watch("avatar_url") ||
                          "https://github.com/shadcn.png"
                        }
                        alt="Avatar"
                      />
                      <AvatarFallback>
                        <LucideUser className="h-12 w-12" />
                      </AvatarFallback>
                    </Avatar>
                    {uploadingAvatar && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                        <span className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"></span>
                      </div>
                    )}
                    {!uploadingAvatar && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white opacity-0 hover:opacity-100 transition-opacity duration-200">
                        <Upload className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) =>
                      handleFileChange(
                        e.target.files ? e.target.files[0] : null
                      )
                    }
                    className="hidden"
                    accept="image/*"
                  />
                </div>
                <FormField
                  control={beneficiaryForm.control}
                  name="first_name"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<
                      z.infer<typeof beneficiarySchema>,
                      "first_name"
                    >;
                  }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={beneficiaryForm.control}
                  name="last_name"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<
                      z.infer<typeof beneficiarySchema>,
                      "last_name"
                    >;
                  }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  {editingBeneficiary ? "Mettre à jour" : "Ajouter"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <p className="text-center">Chargement...</p>
          ) : beneficiaries.length > 0 ? (
            beneficiaries.map((beneficiary: Beneficiary) => (
              <React.Fragment key={beneficiary.id}>
                <div
                  className={`${
                    beneficiary.id === currentUser?.id
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-8 w-8">
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
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm font-semibold m-0">
                            {beneficiary.first_name || ""}{" "}
                            {beneficiary.last_name || ""}
                          </CardTitle>
                          <div className="flex flex-wrap gap-1">
                            {groups.filter((group: Group) =>
                              group.group_beneficiaries.some(
                                (gb: GroupBeneficiary) =>
                                  gb.beneficiary_id === beneficiary.id
                              )
                            ).length > 0 ? (
                              groups
                                .filter((group: Group) =>
                                  group.group_beneficiaries.some(
                                    (gb: GroupBeneficiary) =>
                                      gb.beneficiary_id === beneficiary.id
                                  )
                                )
                                .map((group: Group) => (
                                  <Badge key={group.id} variant="secondary">
                                    {group.name}
                                  </Badge>
                                ))
                            ) : (
                              <Badge variant="outline">Aucun groupe</Badge>
                            )}
                          </div>
                        </div>
                        {beneficiary.first_name ||
                        beneficiary.last_name ? null : (
                          <p className="text-sm text-muted-foreground">
                            Nom non renseigné
                          </p>
                        )}
                      </div>
                    </div>
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Ouvrir le menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {beneficiary.id !== currentUser?.id && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleEditBeneficiaryClick(beneficiary)
                              }
                            >
                              Modifier
                            </DropdownMenuItem>
                          )}
                          {beneficiary.id !== currentUser?.id && (
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-red-500">
                                Supprimer
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Êtes-vous sûr de vouloir supprimer ce bénéficiaire ?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible et supprimera
                            définitivement ce bénéficiaire.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handleDeleteBeneficiary(beneficiary.id)
                            }
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <Separator />
              </React.Fragment>
            ))
          ) : (
            <p className="text-center">Aucun bénéficiaire trouvé.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BeneficiarySettings;
