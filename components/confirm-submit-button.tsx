"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

type ConfirmSubmitButtonProps = {
  children: React.ReactNode;
  confirmMessage: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
};

export function ConfirmSubmitButton({ children, confirmMessage, variant = "primary", className }: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      className={className}
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      {pending ? "Working..." : children}
    </Button>
  );
}
