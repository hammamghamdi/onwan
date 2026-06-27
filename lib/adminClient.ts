export const getAdminAuthHeaders = async () => {
  return {};
};

export const fetchAdminJson = async <T,>(input: string, init?: RequestInit) => {
  const headers = await getAdminAuthHeaders();

  const response = await fetch(input, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...headers,
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    return { data: null, status: response.status };
  }

  return { data: (await response.json()) as T, status: response.status };
};
