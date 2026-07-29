import { env } from "../config/env";

const API_PREFIX = "/api/v1";

export interface FetchOptions extends RequestInit {
  token?: string;
  retry?: boolean;
}

export async function fetcher<T>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const { token, headers, retry = true, ...config } = options;

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
      ...(token && {
        Authorization: `Bearer ${token}`,
      }),
      ...headers,
    },
  });

  console.log("⬅️ Response", {
    url,
    status: response.status,
  });

  if (response.status === 401 && retry && !url.endsWith("/identity/refresh")) {
    console.warn("🔒 Access token expirado. Tentando refresh...");

    const refreshResponse = await fetch(
      `${env.apiUrl}${API_PREFIX}/identity/refresh`,
      {
        method: "POST",
        credentials: "include",
      },
    );

    console.log("🔄 Refresh", {
      url: `${env.apiUrl}${API_PREFIX}/identity/refresh`,
      status: refreshResponse.status,
    });

    if (refreshResponse.ok) {
      console.log("✅ Refresh realizado. Repetindo requisição original...");

      response = await fetch(url, {
        ...config,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token && {
            Authorization: `Bearer ${token}`,
          }),
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
    let error;

    try {
      error = await response.json();
    } catch {
      error = {
        status: response.status,
      };
    }

    console.error("🚨 API Error", error);

    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
