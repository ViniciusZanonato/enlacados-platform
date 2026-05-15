import { describe, it, expect, beforeEach, vi } from "vitest";
import { rateLimit, getClientIp } from "../rateLimit";

// Reinicia o módulo entre testes para limpar o Map interno
beforeEach(() => {
  vi.resetModules();
});

describe("rateLimit", () => {
  it("permite requisições dentro do limite", () => {
    const ip = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(ip, 5, 60_000)).toBe(true);
    }
  });

  it("bloqueia após atingir o limite", () => {
    const ip = `block-${Math.random()}`;
    for (let i = 0; i < 5; i++) rateLimit(ip, 5, 60_000);
    expect(rateLimit(ip, 5, 60_000)).toBe(false);
  });

  it("reseta o contador após a janela de tempo expirar", () => {
    vi.useFakeTimers();
    const ip = `reset-${Math.random()}`;

    for (let i = 0; i < 5; i++) rateLimit(ip, 5, 1_000);
    expect(rateLimit(ip, 5, 1_000)).toBe(false);

    vi.advanceTimersByTime(1_001);
    expect(rateLimit(ip, 5, 1_000)).toBe(true);

    vi.useRealTimers();
  });

  it("isola contadores por IP", () => {
    const ip1 = `iso-a-${Math.random()}`;
    const ip2 = `iso-b-${Math.random()}`;

    for (let i = 0; i < 5; i++) rateLimit(ip1, 5, 60_000);
    expect(rateLimit(ip1, 5, 60_000)).toBe(false);
    expect(rateLimit(ip2, 5, 60_000)).toBe(true);
  });
});

describe("getClientIp", () => {
  it("extrai IP do header x-forwarded-for simples", () => {
    expect(getClientIp({ "x-forwarded-for": "1.2.3.4" })).toBe("1.2.3.4");
  });

  it("extrai primeiro IP de uma lista de proxies", () => {
    expect(getClientIp({ "x-forwarded-for": "1.2.3.4, 10.0.0.1, 172.16.0.1" })).toBe("1.2.3.4");
  });

  it("retorna 'unknown' quando header ausente", () => {
    expect(getClientIp({})).toBe("unknown");
  });

  it("lida com header como array", () => {
    expect(getClientIp({ "x-forwarded-for": ["5.6.7.8", "10.0.0.1"] })).toBe("5.6.7.8");
  });
});
