import { supabase } from "@/lib/supabase";

export const getAdminAuthHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
};

export const fetchAdminJson = async <T,>(input: string, init?: RequestInit) => {
  const headers = await getAdminAuthHeaders();

  if (!headers) {
    return { data: null, status: 401 };
  }

  const response = await fetch(input, {
    ...init,
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
