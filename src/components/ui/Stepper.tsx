import { cn } from "@/lib/utils";
import { Check, Building, Calculator, Calendar } from "lucide-react";

interface StepperProps {
  currentStep: number;
  steps: string[];
  className?: string;
}

const stepIcons = [Building, Calculator, Calendar];

export const Stepper = ({ currentStep, steps, className }: StepperProps) => {
  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className={cn("relative w-full mb-8", className)}>
      {/* Steps container */}
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        {/* Lines container - Hidden on mobile, positioned after steps for proper alignment */}
        <div className="hidden md:block absolute top-6 left-0 right-0 h-0.5 z-0">
          {/* Background Line */}
          <div 
            className="absolute h-full bg-gray-200"
            style={{ 
              left: `${100 / (steps.length * 2)}%`,
              right: `${100 / (steps.length * 2)}%`
            }}
          />
          {/* Progress Line */}
          <div
            className="absolute top-0 h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500 ease-in-out"
            style={{ 
              left: `${100 / (steps.length * 2)}%`,
              width: `${progressPercentage * (1 - 1/steps.length)}%`
            }}
          />
        </div>
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isActive = currentStep === stepNumber;
          const IconComponent = stepIcons[index];

          return (
            <div key={label} className="relative z-10 flex flex-row md:flex-col items-center md:items-center w-full md:w-auto">
              {/* Mobile connector line */}
              {index < steps.length - 1 && (
                <div className="md:hidden absolute left-6 top-12 w-0.5 h-16 bg-gray-200">
                  <div
                    className="w-full bg-gradient-to-b from-purple-500 to-purple-600 transition-all duration-500"
                    style={{ 
                      height: currentStep > stepNumber ? '100%' : '0%'
                    }}
                  />
                </div>
              )}
              
              {/* Step circle */}
              <div
                className={cn(
                  "relative z-20 w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 border-2 shadow-lg transform hover:scale-105",
                  isCompleted
                    ? "border-purple-600 bg-purple-600 text-white shadow-purple-200"
                    : isActive
                    ? "border-purple-500 bg-white text-purple-600 shadow-purple-100"
                    : "border-gray-300 bg-white text-gray-400"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <IconComponent className="w-5 h-5" />
                )}
              </div>
              
              {/* Step label */}
              <div className="ml-4 md:ml-0 md:mt-3 flex-1 md:flex-none md:text-center">
                <p
                  className={cn(
                    "text-sm font-semibold transition-colors duration-300 leading-tight",
                    isActive ? "text-purple-600" : isCompleted ? "text-purple-500" : "text-gray-500"
                  )}
                >
                  Étape {stepNumber}
                </p>
                <p
                  className={cn(
                    "text-xs md:text-sm font-medium transition-colors duration-300 md:w-28 leading-tight",
                    isActive ? "text-gray-900" : "text-gray-600"
                  )}
                >
                  {label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};