import { z } from "zod";

export const incomeSchema = z.object({
  source_name: z
    .string()
    .min(1, { message: "La source du revenu est requise." }),
  amount: z.coerce
    .number()
    .positive({ message: "Le montant doit être un nombre positif." }),
  contributor_user_id: z
    .string()
    .uuid({ message: "Le contributeur est requis." }),
  frequency: z.string().min(1, { message: "La fréquence est requise." }),
  is_shared: z.boolean(),
});
