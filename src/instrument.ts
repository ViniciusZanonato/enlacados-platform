import { useEffect } from "react";
import * as Sentry from "@sentry/react";
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from "react-router-dom";

export const initSentry = () => {
  const DSN = import.meta.env.VITE_SENTRY_DSN;
  if (!DSN) {
    if (import.meta.env.PROD) {
      console.warn("[SRE] VITE_SENTRY_DSN não configurado — monitoramento de erros desativado em produção.");
    }
    return;
  }

  // Validação robusta: Sentry exige uma URL completa, não apenas o ID.
  if (!DSN.startsWith('http')) {
    if (import.meta.env.PROD) {
      console.warn("[SRE] VITE_SENTRY_DSN inválida — monitoramento desativado.");
    }
    return;
  }

  Sentry.init({
    dsn: DSN,
    sendDefaultPii: false,
    integrations: [
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: false,
      }),
    ],

    // Tracing
    tracesSampleRate: 0.2,
    tracePropagationTargets: ["localhost", /^https:\/\/enlacados\.com\.br/],

    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Logs
    enableLogs: true,
    
    environment: import.meta.env.MODE,
  });
};

/**
 * Funções utilitárias mantidas para compatibilidade com o restante do app
 */
export const trackMetric = (name: string, value: number, tags: Record<string, string> = {}) => {
  Sentry.addBreadcrumb({
    category: "metrics",
    message: `${name}: ${value}`,
    data: tags,
    level: "info",
  });
};

export const measurePerformance = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    trackMetric(`${name}_duration_ms`, duration);
    return result;
  } catch (error) {
    trackMetric(`${name}_error`, 1);
    throw error;
  }
};
