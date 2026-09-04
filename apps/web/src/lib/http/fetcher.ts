import { env } from "../config/env";

const API_PREFIX = "/api/v1";

export interface FetchOptions extends RequestInit {
  retry?: boolean;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly error: string | null;

  constructor(
    message: string,
    statusCode: number,
    error: string | null = null,
  ) {
    super(message);

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.error = error;
  }
}

function getApiErrorMessage(message: unknown, statusCode: number): string {
  if (statusCode === 409 && message === "Email already registered") {
    return "Este e-mail já está cadastrado.";
  }

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  return "Ocorreu um erro ao processar a solicitação.";
}

export async function fetcher<T>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const { headers, retry = true, ...config } = options;

  console.log("➡️ Request", {
    url,
    method: config.method,
    retry,
  });

  let response = await fetch(url, {
    ...config,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  console.log("⬅️ Response", {
    url,
    status: response.status,
  });

  if (response.status === 401 && retry && !url.endsWith("/identity/refresh")) {
    console.warn("🔒 Access token expirado. Tentando refresh...");

    const refreshUrl = `${env.apiUrl}${API_PREFIX}/identity/refresh`;

    const refreshResponse = await fetch(refreshUrl, {
      method: "POST",
      credentials: "include",
    });

    console.log("🔄 Refresh", {
      url: refreshUrl,
      status: refreshResponse.status,
    });

    if (refreshResponse.ok) {
      console.log("✅ Refresh realizado. Repetindo requisição original...");

      response = await fetch(url, {
        ...config,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      });

      console.log("🔁 Retry", {
        url,
        status: response.status,
      });
    } else {
      console.error("❌ Refresh falhou.", {
        status: refreshResponse.status,
      });
    }
  }

  if (!response.ok) {
    let payload: {
      message?: unknown;
      error?: string;
      statusCode?: number;
    } = {};

    try {
      payload = await response.json();
      console.log(
        "🚨 API Error Payload",
        JSON.stringify(payload, null, 2),
        "HTTP:",
        response.status,
      );
    } catch {
      console.log("🚨 API Error sem JSON", {
        responseStatus: response.status,
      });
      // Resposta sem JSON.
    }

    const statusCode = payload.statusCode ?? response.status;

    const message = getApiErrorMessage(payload.message, statusCode);

    const apiError = new ApiError(message, statusCode, payload.error ?? null);
    console.error(
      "🚨 API Error",
      JSON.stringify(
        {
          message: apiError.message,
          statusCode: apiError.statusCode,
          error: apiError.error,
        },
        null,
        2,
      ),
    );

    throw apiError;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
