export interface FetchOptions extends RequestInit {
  token?: string;
}

export async function fetcher<T>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const { token, headers, ...config } = options;

  const response = await fetch(url, {
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

  if (!response.ok) {
    throw await response.json();
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
