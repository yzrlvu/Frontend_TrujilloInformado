/** Endpoints de autenticación. */
export const createAuthApi = (http) => ({
  register: (data) => http.request("/api/v1/auth/registro", { method: "POST", body: data }),
  /** @returns {Promise<{accessToken: string, role?: string}>} */
  authenticate: ({ email, password }) =>
    http.request("/api/v1/auth/autenticar", { method: "POST", body: { email, password } }),
});
