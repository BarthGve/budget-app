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
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Stepper } from "@/components/ui/Stepper";
import React, { useState } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

interface MultiStepFormProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: (values: T) => void;
  steps: string[];
  validationSteps: Path<T>[][];
  children: (currentStep: number) => React.ReactNode;
  submitButtonText?: string;
  dialogTexts: {
    title: string;
    description: string;
    cancel: string;
    confirm: string;
  };
}

export function MultiStepForm<T extends FieldValues>({
  form,
  onSubmit,
  steps,
  validationSteps,
  children,
  submitButtonText = "Soumettre",
  dialogTexts,
}: MultiStepFormProps<T>) {
  const [currentStep, setCurrentStep] = useState(1);

  const nextStep = async () => {
    const fields = validationSteps[currentStep - 1];
    const isValid = await form.trigger(fields);
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => e.preventDefault()} // Prevent default on Enter
        className="space-y-4"
      >
        <Stepper currentStep={currentStep} steps={steps} />

        <div className="mt-6 space-y-4">{children(currentStep)}</div>

        <div className="flex justify-between pt-4">
          {currentStep > 1 ? (
            <Button type="button" variant="outline" onClick={prevStep}>
              Précédent
            </Button>
          ) : (
            <div />
          )}
          {currentStep < steps.length ? (
            <Button type="button" onClick={nextStep} className="ml-auto">
              Suivant
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" className="ml-auto">
                  {submitButtonText}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{dialogTexts.title}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {dialogTexts.description}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{dialogTexts.cancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={form.handleSubmit(onSubmit)}>
                    {dialogTexts.confirm}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </form>
    </Form>
  );
}
