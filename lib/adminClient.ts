"use client";

import { ReactNode } from "react";

let adminCsrfToken = "";

export function AdminCsrfProvider({
  csrfToken,
  children,
}: {
  csrfToken: string;
  children: ReactNode;
}) {
  adminCsrfToken = csrfToken;

  return children;
}

export const getAdminAuthHeaders = async (): Promise<Record<string, string>> => {
  return adminCsrfToken ? { "X-CSRF-Token": adminCsrfToken } : {};
};

export const fetchAdminJson = async <T,>(input: string, init?: RequestInit) => {
  const method = init?.method?.toUpperCase() || "GET";
  const headers: Record<string, string> =
    method === "GET" ? {} : await getAdminAuthHeaders();

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
