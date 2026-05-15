import { PostgrestError } from "@supabase/supabase-js";
import { toast } from "sonner";

const isPostgrestError = (error: unknown): error is PostgrestError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    "code" in error
  );
};

export const handleSupabaseError = (error: PostgrestError | Error | unknown, customMessage?: string) => {
  console.error("Supabase Error:", error);

  let message = customMessage || "Ocorreu um erro inesperado.";

  if (error instanceof Error) {
    message = error.message;
  } else if (isPostgrestError(error)) {
    switch (error.code) {
      case "23505": // Unique violation
        message = "Já existe um registro com esses dados. Por favor, verifique os campos e tente novamente.";
        break;
      // Add more cases here as needed
      default:
        // Use the provided error message if it's not a handled case
        message = customMessage || error.message || "Ocorreu um erro inesperado.";
    }
  }

  toast.error(message);
  return new Error(message); // Return a new Error object for consistent error propagation
};
