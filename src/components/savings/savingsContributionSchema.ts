import { z } from "zod";

export const savingsContributionSchema = z.object({
  type: z.string().min(1, { message: "Le type de compte est requis." }),
  amount: z.coerce
    .number()
    .positive({ message: "Le montant doit être un nombre positif." }),
  frequency: z.string().min(1, { message: "La fréquence est requise." }),
  start_date: z.date({ required_error: "La date de début est requise." }),
  domain: z.string().nullable().optional(),
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
});

export type SavingsContributionFormValues = z.infer<
  typeof savingsContributionSchema
>;
