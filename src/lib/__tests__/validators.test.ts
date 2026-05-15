import { describe, it, expect } from "vitest";
import {
  validatePassword,
  validateFile,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_FILE_TYPES,
} from "../validators";

describe("validatePassword", () => {
  it("rejeita senha com menos de 8 caracteres", () => {
    const result = validatePassword("Ab1!");
    expect(result.isValid).toBe(false);
    expect(result.message).toMatch(/8 caracteres/);
  });

  it("rejeita senha sem letra maiúscula", () => {
    const result = validatePassword("abcdef1!");
    expect(result.isValid).toBe(false);
    expect(result.message).toMatch(/maiúscula/);
  });

  it("rejeita senha sem letra minúscula", () => {
    const result = validatePassword("ABCDEF1!");
    expect(result.isValid).toBe(false);
    expect(result.message).toMatch(/minúscula/);
  });

  it("rejeita senha sem número", () => {
    const result = validatePassword("Abcdefg!");
    expect(result.isValid).toBe(false);
    expect(result.message).toMatch(/número/);
  });

  it("rejeita senha sem símbolo", () => {
    const result = validatePassword("Abcdef12");
    expect(result.isValid).toBe(false);
    expect(result.message).toMatch(/símbolo/);
  });

  it("aceita senha válida com todos os requisitos", () => {
    const result = validatePassword("Senha@123");
    expect(result.isValid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it("aceita senha com diferentes símbolos permitidos", () => {
    expect(validatePassword("Teste#123").isValid).toBe(true);
    expect(validatePassword("Teste$123").isValid).toBe(true);
    expect(validatePassword("Teste%123").isValid).toBe(true);
  });
});

describe("validateFile", () => {
  const makeFile = (name: string, type: string, sizeBytes: number): File => {
    const blob = new Blob([new Uint8Array(sizeBytes)], { type });
    return new File([blob], name, { type });
  };

  it("rejeita arquivo acima de 5MB", () => {
    const file = makeFile("grande.xlsx", ALLOWED_FILE_TYPES[0], MAX_FILE_SIZE_BYTES + 1);
    const result = validateFile(file);
    expect(result.isValid).toBe(false);
    expect(result.message).toMatch(/5MB/);
  });

  it("rejeita tipo de arquivo não permitido", () => {
    const file = makeFile("script.js", "application/javascript", 100);
    const result = validateFile(file);
    expect(result.isValid).toBe(false);
    expect(result.message).toMatch(/não permitido/);
  });

  it("aceita .xlsx dentro do limite", () => {
    const file = makeFile("dados.xlsx", ALLOWED_FILE_TYPES[0], 1024);
    const result = validateFile(file);
    expect(result.isValid).toBe(true);
  });

  it("aceita .csv dentro do limite", () => {
    const file = makeFile("alunos.csv", "text/csv", 2048);
    const result = validateFile(file);
    expect(result.isValid).toBe(true);
  });

  it("aceita imagem PNG dentro do limite", () => {
    const file = makeFile("foto.png", "image/png", 500_000);
    const result = validateFile(file);
    expect(result.isValid).toBe(true);
  });

  it("aceita tipos customizados via parâmetro allowedTypes", () => {
    const file = makeFile("doc.txt", "text/plain", 100);
    const result = validateFile(file, ["text/plain"]);
    expect(result.isValid).toBe(true);
  });
});
