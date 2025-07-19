import { z } from "zod";

export const savingsContributionSchema = z.object({
  account_type_id: z
    .string()
    .uuid({ message: "Le type de compte est requis." })
    .nullable(), // Ajout de .nullable()
  enseigne_id: z
    .string()
    .uuid({ message: "Veuillez sélectionner un établissement." })
    .nullable()
    .optional(),
  amount: z.coerce
    .number()
    .positive({ message: "Le montant doit être un nombre positif." }),
  frequency: z.string().min(1, { message: "La fréquence est requise." }),
  start_date: z.date({ required_error: "La date de début est requise." }),
  logo_url: z
    .string()
    .url({ message: "URL de logo invalide." })
    .nullable()
    .optional()
    .or(z.literal("")),
  beneficiary_id: z
    .string()
    .uuid({ message: "Bénéficiaire invalide." })
    .nullable()
    .optional(),
  is_shared: z.boolean(), // Made required to fix type mismatch
});
