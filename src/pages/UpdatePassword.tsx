import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { ControllerRenderProps } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import Loader from "../components/ui/Loader"; // Import the new Loader component

// Initialisation de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const formSchema = z
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

function UpdatePassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessionLoaded, setSessionLoaded] = useState(false); // New state to track if session is loaded

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setSessionLoaded(true);
          setLoading(false);
        } else if (event === "SIGNED_OUT") {
          // If user signs out or is deleted, redirect to login
          toast.error(
            "Session d'authentification manquante ou expirée. Veuillez vous reconnecter."
          );
          navigate("/login");
        } else if (event === "INITIAL_SESSION" && !session) {
          // If initial session check finds no session, and it's not a sign-out/delete event
          // This handles cases where the user directly accesses the page without a valid session from the email link
          toast.error(
            "Session d'authentification manquante. Veuillez réessayer la réinitialisation du mot de passe."
          );
          navigate("/login");
        }
      }
    );

    // Also check for session immediately on mount, in case onAuthStateChange doesn't fire immediately
    const checkInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setSessionLoaded(true);
      }
      setLoading(false);
    };
    checkInitialSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!sessionLoaded) {
      toast.error(
        "La session n'est pas encore établie. Veuillez patienter ou réessayer."
      );
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(
          "Votre mot de passe a été mis à jour avec succès ! Vous pouvez maintenant vous connecter."
        );
        navigate("/login");
      }
    } catch (error: unknown) {
      toast.error((error as Error).message);
    }
  };

  if (loading) {
    return <Loader message="Chargement..." />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 p-4 pt-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">
            Mettre à jour votre mot de passe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    z.infer<typeof formSchema>,
                    "password"
                  >;
                }) => (
                  <FormItem>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Nouveau mot de passe"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    z.infer<typeof formSchema>,
                    "confirmPassword"
                  >;
                }) => (
                  <FormItem>
                    <FormLabel>Confirmer le mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirmer le mot de passe"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                Mettre à jour le mot de passe
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default UpdatePassword;
