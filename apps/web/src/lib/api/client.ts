import { env } from "../config/env";
import { fetcher } from "../http/fetcher";

const API_PREFIX = "/api/v1";

class ApiClient {
  private buildUrl(path: string) {
    return `${env.apiUrl}${API_PREFIX}${path}`;
  }

  get<T>(path: string) {
    return fetcher<T>(this.buildUrl(path), {
      method: "GET",
    });
  }

  post<T>(path: string, body?: unknown) {
    return fetcher<T>(this.buildUrl(path), {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: unknown) {
    return fetcher<T>(this.buildUrl(path), {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  patch<T>(path: string, body?: unknown) {
    return fetcher<T>(this.buildUrl(path), {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  delete<T>(path: string) {
    return fetcher<T>(this.buildUrl(path), {
      method: "DELETE",
    });
  }
}

export const api = new ApiClient();
