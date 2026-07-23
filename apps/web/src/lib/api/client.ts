import { env } from "../config/env";
import { fetcher } from "../http/fetcher";

const API_PREFIX = "/api/v1";

class ApiClient {
  private buildUrl(path: string) {
    return `${env.apiUrl}${API_PREFIX}${path}`;
  }

  get<T>(path: string, token?: string) {
    return fetcher<T>(this.buildUrl(path), {
      method: "GET",
      token,
    });
  }

  post<T>(path: string, body?: unknown, token?: string) {
    return fetcher<T>(this.buildUrl(path), {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      token,
    });
  }

  put<T>(path: string, body?: unknown, token?: string) {
    return fetcher<T>(this.buildUrl(path), {
      method: "PUT",
      body: JSON.stringify(body),
      token,
    });
  }

  patch<T>(path: string, body?: unknown, token?: string) {
    return fetcher<T>(this.buildUrl(path), {
      method: "PATCH",
      body: JSON.stringify(body),
      token,
    });
  }

  delete<T>(path: string, token?: string) {
    return fetcher<T>(this.buildUrl(path), {
      method: "DELETE",
      token,
    });
  }
}

export const api = new ApiClient();
