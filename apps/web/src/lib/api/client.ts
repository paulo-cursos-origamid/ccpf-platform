import { useTenantStore } from "@/modules/tenant/stores";

import { env } from "../config/env";
import { fetcher } from "../http/fetcher";

const API_PREFIX = "/api/v1";

interface ApiRequestOptions {
  // Define se a requisição deve receber automaticamente
  // o header X-Tenant-Id.
  //
  // Por padrão, endpoints da aplicação são Tenant-aware.
  tenantAware?: boolean;
}

class ApiClient {
  private buildUrl(path: string) {
    return `${env.apiUrl}${API_PREFIX}${path}`;
  }

  private buildHeaders(options?: ApiRequestOptions): HeadersInit {
    const headers: Record<string, string> = {};

    const tenantAware = options?.tenantAware ?? true;

    if (tenantAware) {
      const activeTenantId = useTenantStore.getState().activeTenantId;

      if (activeTenantId) {
        headers["X-Tenant-Id"] = activeTenantId;
      }
    }

    return headers;
  }

  get<T>(path: string, options?: ApiRequestOptions) {
    return fetcher<T>(this.buildUrl(path), {
      method: "GET",
      headers: this.buildHeaders(options),
    });
  }

  post<T>(
    path: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ) {
    return fetcher<T>(this.buildUrl(path), {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      headers: this.buildHeaders(options),
    });
  }

  put<T>(
    path: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ) {
    return fetcher<T>(this.buildUrl(path), {
      method: "PUT",
      body: JSON.stringify(body),
      headers: this.buildHeaders(options),
    });
  }

  patch<T>(
    path: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ) {
    return fetcher<T>(this.buildUrl(path), {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: this.buildHeaders(options),
    });
  }

  delete<T>(path: string, options?: ApiRequestOptions) {
    return fetcher<T>(this.buildUrl(path), {
      method: "DELETE",
      headers: this.buildHeaders(options),
    });
  }
}

export const api = new ApiClient();