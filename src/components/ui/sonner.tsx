import { Toaster as Sonner } from "sonner"

const Toaster = ({ ...props }: React.ComponentPropsWithoutRef<typeof Sonner>) => {
  return (
    <Sonner
      theme="light" // Définir un thème par défaut ou le rendre configurable si nécessaire
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }