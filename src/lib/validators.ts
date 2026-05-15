export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: "A senha deve ter no mínimo 8 caracteres." };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: "A senha deve conter pelo menos uma letra maiúscula." };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: "A senha deve conter pelo menos uma letra minúscula." };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: "A senha deve conter pelo menos um número." };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, message: "A senha deve conter pelo menos um símbolo." };
  }
  return { isValid: true };
};

export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_FILE_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
  "text/csv", // .csv
  "application/pdf", // .pdf
  "image/jpeg",
  "image/png",
  "image/webp"
];

export const validateFile = (file: File, allowedTypes: string[] = ALLOWED_FILE_TYPES): { isValid: boolean; message?: string } => {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { isValid: false, message: `O arquivo deve ser menor que ${MAX_FILE_SIZE_MB}MB.` };
  }
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, message: "Tipo de arquivo não permitido." };
  }
  return { isValid: true };
};
