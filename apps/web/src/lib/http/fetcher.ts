import { env } from "../config/env";

const API_PREFIX = "/api/v1";

export interface FetchOptions extends RequestInit {
  retry?: boolean;
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

// import { env } from "../config/env";

// const API_PREFIX = "/api/v1";

// export interface FetchOptions extends RequestInit {
//   retry?: boolean;
// }

// /**
//  * Garante que somente um refresh aconteça por vez.
//  *
//  * Como o backend faz rotation do refresh token,
//  * duas chamadas simultâneas de refresh podem invalidar
//  * uma à outra.
//  */
// let refreshPromise: Promise<boolean> | null = null;

// async function refreshAccessToken(): Promise<boolean> {
//   if (!refreshPromise) {
//     refreshPromise = fetch(`${env.apiUrl}${API_PREFIX}/identity/refresh`, {
//       method: "POST",
//       credentials: "include",
//     })
//       .then((response) => {
//         console.log("🔄 Refresh", {
//           url: `${env.apiUrl}${API_PREFIX}/identity/refresh`,
//           status: response.status,
//         });

//         return response.ok;
//       })
//       .catch((error) => {
//         console.error("❌ Erro no refresh", error);

//         return false;
//       })
//       .finally(() => {
//         refreshPromise = null;
//       });
//   } else {
//     console.log("⏳ Refresh já em andamento. Aguardando...");
//   }

//   return refreshPromise;
// }

// export async function fetcher<T>(
//   url: string,
//   options: FetchOptions = {},
// ): Promise<T> {
//   const { headers, retry = true, ...config } = options;

//   console.log("➡️ Request", {
//     url,
//     method: config.method,
//     retry,
//   });

//   let response = await fetch(url, {
//     ...config,
//     credentials: "include",
//     headers: {
//       "Content-Type": "application/json",
//       ...headers,
//     },
//   });

//   console.log("⬅️ Response", {
//     url,
//     status: response.status,
//   });

//   /**
//    * Access token expirado.
//    *
//    * Não tenta refresh quando a própria requisição
//    * já é a rota de refresh.
//    */
//   if (response.status === 401 && retry && !url.endsWith("/identity/refresh")) {
//     console.warn("🔒 Access token expirado. Tentando refresh...");

//     const refreshed = await refreshAccessToken();

//     if (refreshed) {
//       console.log("✅ Refresh realizado. Repetindo requisição original...");

//       /**
//        * Não enviamos Authorization aqui.
//        *
//        * O novo access_token está no cookie HttpOnly
//        * recebido pelo browser.
//        */
//       response = await fetch(url, {
//         ...config,
//         credentials: "include",
//         headers: {
//           "Content-Type": "application/json",
//           ...headers,
//         },
//       });

//       console.log("🔁 Retry", {
//         url,
//         status: response.status,
//       });
//     } else {
//       console.error("❌ Refresh falhou.");
//     }
//   }

//   if (!response.ok) {
//     let error;

//     try {
//       error = await response.json();
//     } catch {
//       error = {
//         status: response.status,
//       };
//     }

//     console.error("🚨 API Error", error);

//     throw error;
//   }

//   if (response.status === 204) {
//     return undefined as T;
//   }

//   return response.json();
// }

// import { env } from "../config/env";

// const API_PREFIX = "/api/v1";

// export interface FetchOptions extends RequestInit {
//   token?: string;
//   retry?: boolean;
// }

// export async function fetcher<T>(
//   url: string,
//   options: FetchOptions = {},
// ): Promise<T> {
//   const { token, headers, retry = true, ...config } = options;

//   console.log("➡️ Request", {
//     url,
//     method: config.method,
//     retry,
//   });

//   let response = await fetch(url, {
//     ...config,
//     credentials: "include",
//     headers: {
//       "Content-Type": "application/json",
//       ...(token && {
//         Authorization: `Bearer ${token}`,
//       }),
//       ...headers,
//     },
//   });

//   console.log("⬅️ Response", {
//     url,
//     status: response.status,
//   });

//   if (response.status === 401 && retry && !url.endsWith("/identity/refresh")) {
//     console.warn("🔒 Access token expirado. Tentando refresh...");

//     const refreshResponse = await fetch(
//       `${env.apiUrl}${API_PREFIX}/identity/refresh`,
//       {
//         method: "POST",
//         credentials: "include",
//       },
//     );

//     console.log("🔄 Refresh", {
//       url: `${env.apiUrl}${API_PREFIX}/identity/refresh`,
//       status: refreshResponse.status,
//     });

//     if (refreshResponse.ok) {
//       console.log("✅ Refresh realizado. Repetindo requisição original...");

//       response = await fetch(url, {
//         ...config,
//         credentials: "include",
//         headers: {
//           "Content-Type": "application/json",
//           ...(token && {
//             Authorization: `Bearer ${token}`,
//           }),
//           ...headers,
//         },
//       });

//       console.log("🔁 Retry", {
//         url,
//         status: response.status,
//       });
//     } else {
//       console.error("❌ Refresh falhou.", {
//         status: refreshResponse.status,
//       });
//     }
//   }

//   if (!response.ok) {
//     let error;

//     try {
//       error = await response.json();
//     } catch {
//       error = {
//         status: response.status,
//       };
//     }

//     console.error("🚨 API Error", error);

//     throw error;
//   }

//   if (response.status === 204) {
//     return undefined as T;
//   }

//   return response.json();
// }
