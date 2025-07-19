import { zodResolver } from "@hookform/resolvers/zod";
import { createClient, PostgrestError } from "@supabase/supabase-js";
import {
  CircleUserRound,
  Info,
  KeyRound,
  KeyRoundIcon,
  User as LucideUser,
  Send,
  Share,
  Upload,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";

import { CollaborationListItem } from "../components/profile/CollaborationListItem";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { useData } from "../context/data-context-utils";
import type { Collaboration, User } from "../types";

// Initialisation de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatarUrl: z
    .string()
    .url({ message: "URL d'avatar invalide." })
    .optional()
    .or(z.literal("")),
  savings_goal_percentage: z.coerce.number().min(0).max(100).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(12, {
        message: "Le mot de passe doit contenir au moins 12 caractères.",
      })
      .regex(/[A-Z]/, {
        message: "Le mot de passe doit contenir au moins une majuscule.",
      })
      .regex(/[a-z]/, {
        message: "Le mot de passe doit contenir au moins une minuscule.",
      })
      .regex(/[0-9]/, {
        message: "Le mot de passe doit contenir au moins un chiffre.",
      })
      .regex(/[^a-zA-Z0-9]/, {
        message: "Le mot de passe doit contenir au moins un caractère spécial.",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

const inviteSchema = z.object({
  email: z.string().email({ message: "Adresse email invalide." }),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface ProfileProps {
  onUserUpdate: (user: User) => void;
}

function Profile({ onUserUpdate }: ProfileProps) {
  const data = useData();
  const {
    user: contextUser,
    fetchAllData,
    collaborations: allCollaborations = [],
  } = data || {};

  const [user, setUser] = useState<User | null>(contextUser || null);
  useEffect(() => {
    if (contextUser) {
      setUser(contextUser);
    }
  }, [contextUser]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const navigate = useNavigate();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      avatarUrl: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    const fetchUserAndCollaborations = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        profileForm.reset({
          firstName: user.user_metadata?.firstName || "",
          lastName: user.user_metadata?.lastName || "",
          avatarUrl: user.user_metadata?.avatar_url || "",
        });
      } else {
        toast.error("Vous devez être connecté pour accéder à cette page.");
        navigate("/login");
      }
      setLoading(false);
    };
    fetchUserAndCollaborations();
  }, [navigate, profileForm]);

  const handleFileChange = useCallback(
    async (file: File | null) => {
      if (!file) return;

      setUploadingAvatar(true);
      try {
        if (!file.type.startsWith("image/")) {
          toast.error("Le fichier doit être une image.");
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
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
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, optimizedFile, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          toast.error(`Erreur d'upload: ${uploadError.message}`);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        if (publicUrlData.publicUrl) {
          const { error: updateError } = await supabase.auth.updateUser({
            data: { avatar_url: publicUrlData.publicUrl },
          });

          if (updateError) {
            toast.error(
              `Erreur de mise à jour du profil: ${updateError.message}`
            );
          } else {
            toast.success("Avatar mis à jour avec succès !");
            const {
              data: { user: updatedUser },
            } = await supabase.auth.getUser();
            if (updatedUser) {
              setUser(updatedUser as User);
              profileForm.setValue(
                "avatarUrl",
                updatedUser.user_metadata?.avatar_url || ""
              );
              onUserUpdate(updatedUser as User);
            }
          }
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
    [user, profileForm, onUserUpdate]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileChange(e.dataTransfer.files[0]);
      }
    },
    [handleFileChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    try {
      // Update user_metadata for avatar_url
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          firstName: values.firstName,
          lastName: values.lastName,
          avatar_url: values.avatarUrl,
          savings_goal_percentage: values.savings_goal_percentage,
        },
      });

      if (authUpdateError) {
        toast.error(authUpdateError.message);
        return;
      }

      // Update profiles table for consistency
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
          first_name: values.firstName,
          last_name: values.lastName,
          avatar_url: values.avatarUrl,
          savings_goal_percentage: values.savings_goal_percentage,
        })
        .eq("id", user?.id);

      if (profileUpdateError) {
        toast.error(profileUpdateError.message);
      } else {
        toast.success("Profil mis à jour avec succès !");
        // Fetch the updated user to ensure local state is consistent
        const {
          data: { user: updatedUser },
        } = await supabase.auth.getUser();
        if (updatedUser) {
          // Update local user state and pass to parent
          setUser(updatedUser);
          onUserUpdate(updatedUser);
        }

        // Propagate savings goal to collaborators
        if (allCollaborations.length > 0 && user?.id) {
          const collaboratorIds = allCollaborations
            .filter((c) => c.status === "accepted")
            .map((c) =>
              c.invitee_id === user?.id ? c.inviter_id : c.invitee_id
            );
          const { error: updateCollaboratorsError } = await supabase
            .from("profiles")
            .update({ savings_goal_percentage: values.savings_goal_percentage })
            .in("id", collaboratorIds);

          if (updateCollaboratorsError) {
            toast.error(
              "Erreur lors de la mise à jour de l'objectif d'épargne des collaborateurs."
            );
          }
        }
      }
    } catch (error: unknown) {
      toast.error((error as Error).message);
    }
  };

  const handlePasswordSubmit = async (
    values: z.infer<typeof passwordSchema>
  ) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        toast.error(error.message);
        if (
          error.message.includes("User from sub claim in JWT does not exist")
        ) {
          await supabase.auth.signOut();
          navigate("/login");
        }
      } else {
        toast.success("Mot de passe mis à jour avec succès !");
        passwordForm.reset();
      }
    } catch (error: unknown) {
      toast.error((error as Error).message);
    }
  };

  const handleSendInvitation = async (values: z.infer<typeof inviteSchema>) => {
    if (!user?.id) {
      toast.error("Vous devez être connecté pour envoyer une invitation.");
      return;
    }

    // 1. Trouver l'ID de l'utilisateur invité par son email
    const { data: inviteeProfile, error: fetchError } = (await supabase
      .from("profiles")
      .select("id")
      .eq("email", values.email)
      .single()) as {
      data: { id: string } | null;
      error: PostgrestError | null;
    };

    if (fetchError || !inviteeProfile) {
      toast.error("Aucun utilisateur trouvé avec cet email.");
      return;
    }

    if (inviteeProfile.id === user.id) {
      toast.error("Vous ne pouvez pas vous inviter vous-même.");
      return;
    }

    // 2. Vérifier si une invitation existe déjà
    const { data: existingCollab, error: existingCollabError } = await supabase
      .from("collaborations")
      .select("id, status")
      .or(
        `and(inviter_id.eq.${user.id},invitee_id.eq.${inviteeProfile.id}),and(inviter_id.eq.${inviteeProfile.id},invitee_id.eq.${user.id})`
      )
      .single();

    if (existingCollabError && existingCollabError.code !== "PGRST116") {
      // PGRST116 means no rows found
      toast.error(
        `Erreur lors de la vérification de l'invitation existante: ${existingCollabError.message}`
      );
      return;
    }

    if (existingCollab) {
      if (existingCollab.status === "pending") {
        toast.info("Une invitation est déjà en attente avec cet utilisateur.");
      } else if (existingCollab.status === "accepted") {
        toast.info("Vous collaborez déjà avec cet utilisateur.");
      }
      return;
    }

    // 3. Insérer la nouvelle invitation
    const { error: insertError } = await supabase
      .from("collaborations")
      .insert({
        inviter_id: user.id,
        invitee_id: inviteeProfile.id,
        status: "pending",
      });

    if (insertError) {
      toast.error(
        `Erreur lors de l'envoi de l'invitation: ${insertError.message}`
      );
    } else {
      toast.success("Invitation envoyée avec succès !");
      inviteForm.reset();
      if (user?.id && fetchAllData) {
        fetchAllData(user.id); // Refresh collaborations
      }
      setIsInviteModalOpen(false); // Close the modal

      // Send notification to invitee
      const inviterDisplayName =
        user.user_metadata?.first_name && user.user_metadata?.last_name
          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
          : user.email;

      const { error: notificationError } = await supabase.functions.invoke(
        "send-collaboration-invite-notification",
        {
          body: {
            inviterId: user.id,
            inviteeId: inviteeProfile.id,
            inviterDisplayName: inviterDisplayName,
          },
        }
      );

      if (notificationError) {
        console.error(
          "Erreur lors de l'envoi de la notification d'invitation:",
          notificationError
        );
        toast.error("Erreur lors de l'envoi de la notification d'invitation.");
      }
    }
  };

  const handleAcceptRejectCollaboration = async (
    collabId: string,
    newStatus: "accepted" | "rejected"
  ) => {
    if (!user || !fetchAllData) return;
    const { data, error } = await supabase
      .from("collaborations")
      .update({ status: newStatus })
      .eq("id", collabId)
      .select("*");

    if (error) {
      toast.error(
        `Erreur lors de la mise à jour de la collaboration: ${error.message}`
      );
    } else {
      toast.success(
        `Invitation ${
          newStatus === "accepted" ? "acceptée" : "refusée"
        } avec succès !`
      );
      fetchAllData(user.id); // Refresh collaborations

      if (newStatus === "accepted") {
        // Fetch inviter's profile to get their savings_goal_percentage
        const { data: inviterProfile, error: inviterProfileError } =
          await supabase
            .from("profiles")
            .select("savings_goal_percentage")
            .eq("id", data[0].inviter_id)
            .single();

        if (inviterProfileError) {
          console.error("Error fetching inviter profile:", inviterProfileError);
          toast.error(
            "Erreur lors de la récupération du profil de l'inviteur."
          );
          return;
        }

        // Call the edge function to sync the savings goal
        const { error: syncError } = await supabase.functions.invoke(
          "sync-savings-goal",
          {
            body: {
              user_id: data[0].inviter_id,
              new_percentage: inviterProfile.savings_goal_percentage,
            },
          }
        );

        if (syncError) {
          console.error("Error syncing savings goal:", syncError);
          toast.error(
            "Erreur lors de la synchronisation de l'objectif d'épargne."
          );
          return;
        }

        // Send notification to the inviter
        const { data: accepterProfile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single();

        let accepterDisplayName = user.email; // Fallback
        if (accepterProfile) {
          accepterDisplayName =
            accepterProfile.first_name && accepterProfile.last_name
              ? `${accepterProfile.first_name} ${accepterProfile.last_name}`
              : accepterProfile.first_name || user.email;
        }

        const { error: notificationError } = await supabase.functions.invoke(
          "send-collaboration-accepted-notification",
          {
            body: {
              accepterId: user.id,
              inviterId: data[0].inviter_id,
              accepterDisplayName: accepterDisplayName,
            },
          }
        );

        if (notificationError) {
          console.error(
            "Erreur lors de l'envoi de la notification d'acceptation:",
            notificationError
          );
          toast.error(
            "Erreur lors de l'envoi de la notification d'acceptation."
          );
        }
      }
      // Trigger global data refresh
      fetchAllData(user.id);
    }
  };

  const handleEndCollaboration = async (collabId: string) => {
    if (!user || !fetchAllData) return;
    try {
      const { error } = await supabase.functions.invoke(
        "on-collaboration-ended",
        {
          body: { collabId },
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      toast.success("Collaboration terminée avec succès !");
      toast.info("Les crédits partagés ont été mis à jour si nécessaire.");
      fetchAllData(user.id);
    } catch (error: unknown) {
      toast.error(
        `Erreur lors de la fin de la collaboration: ${(error as Error).message}`
      );
    }
  };

  const handleCancelInvitation = async (collabId: string) => {
    if (!user || !fetchAllData) return;
    const { error } = await supabase
      .from("collaborations")
      .delete()
      .eq("id", collabId);

    if (error) {
      toast.error(
        `Erreur lors de l'annulation de l'invitation: ${error.message}`
      );
    } else {
      toast.success("Invitation annulée avec succès !");
      fetchAllData(user.id); // Refresh collaborations
      try {
        await supabase.functions.invoke("unshare-user-credits-if-no-collabs", {
          body: { userId: user.id },
        });
      } catch (edgeError) {
        console.error(
          "Error invoking unshare-user-credits-if-no-collabs after cancel invite:",
          edgeError
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Chargement du profil...
      </div>
    );
  }

  const isGitHubUser = user?.app_metadata?.provider === "github";

  return (
    <>
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-2">
        <CircleUserRound className="h-9 w-9" />
        Gérer votre profil
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* First Column */}
        <div className="space-y-4">
          {/* Profile Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info /> Informations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-6">
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
                        profileForm.watch("avatarUrl") ||
                        (typeof user?.user_metadata?.avatar_url === "string"
                          ? user.user_metadata.avatar_url
                          : "") ||
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
                    handleFileChange(e.target.files ? e.target.files[0] : null)
                  }
                  className="hidden"
                  accept="image/*"
                />
                <p className="text-lg font-semibold mt-4">{user?.email}</p>
              </div>
              <Form {...profileForm}>
                <form
                  onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={profileForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Mettre à jour le profil
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Password Change Card (Conditional) */}
          {!isGitHubUser && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRoundIcon /> Mot de passe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={passwordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nouveau mot de passe</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Confirmer le nouveau mot de passe
                          </FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Changer le mot de passe
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {isGitHubUser && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-gray-600" />
                  Changer le mot de passe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Vous êtes connecté via GitHub. Pour changer votre mot de
                  passe, veuillez le faire directement sur GitHub.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Second Column */}
        <div className="space-y-8">
          {/* Data Sharing Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share className="h-5 w-5 text-gray-600" />
                  Partage de Données
                </div>
                <Button onClick={() => setIsInviteModalOpen(true)}>
                  <Send /> invitation
                </Button>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Collaborez avec d'autres utilisateurs pour partager et gérer vos
                données financières en commun.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allCollaborations.length === 0 ? (
                  <p className="text-gray-500">
                    Aucune collaboration trouvée pour le moment.
                  </p>
                ) : (
                  allCollaborations.map((collab: Collaboration) => (
                    <CollaborationListItem
                      key={collab.id}
                      collaboration={collab}
                      currentUserId={user?.id || ""}
                      onAcceptReject={handleAcceptRejectCollaboration}
                      onCancel={handleCancelInvitation}
                      onEnd={handleEndCollaboration}
                    />
                  ))
                )}
              </div>
              <Dialog
                open={isInviteModalOpen}
                onOpenChange={setIsInviteModalOpen}
              >
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Envoyer une invitation</DialogTitle>
                  </DialogHeader>
                  <Form {...inviteForm}>
                    <form
                      onSubmit={inviteForm.handleSubmit(handleSendInvitation)}
                      className="space-y-4"
                    >
                      <FormField
                        control={inviteForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Email de l'utilisateur à inviter
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="collaborateur@example.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full">
                        Envoyer l'invitation
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default Profile;
