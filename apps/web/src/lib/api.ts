import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL;

async function getAccessToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }

  return session.access_token;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken();

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ?? "API request failed",
    );
  }

  return data as T;
}

export async function getMySettings() {
  return apiFetch<{
    success: true;

    user: {
      id: string;
      email: string;
      name: string;
      timezone: string;
    };

    settings: {
      tracking: {
        threshold: string;
        enabled: boolean;
      } | null;

      smartMoneyRule: {
        netFlowWeight: number;
        largeTransactionsWeight: number;
        activityWeight: number;
        positiveFlowWeight: number;
        netFlowThresholdUsd: string;
        largeTransactionCount: number;
        activityCount: number;
        positiveFlowThresholdUsd: string;
        enabled: boolean;
      } | null;

      notification: {
        chatId: string;
        enabled: boolean;
      } | null;
    };
  }>("/me/settings");
}

export async function updateMyTracking(input: {
  threshold: string;
  enabled?: boolean;
}) {
  return apiFetch("/me/tracking", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function updateMySmartMoneyRule(input: {
  netFlowWeight?: number;
  largeTransactionsWeight?: number;
  activityWeight?: number;
  positiveFlowWeight?: number;
  netFlowThresholdUsd?: string;
  largeTransactionCount?: number;
  activityCount?: number;
  positiveFlowThresholdUsd?: string;
  enabled?: boolean;
}) {
  return apiFetch("/me/smart-money-rule", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function updateMyTelegramNotification(
  input: {
    chatId: string;
    enabled?: boolean;
  },
) {
  return apiFetch(
    "/me/notification/telegram",
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  );
}

export async function acceptTerms() {
  return apiFetch<{
    success: true;
    user: {
      id: string;
      authUserId: string | null;
      email: string;
      name: string;
      timezone: string;
      termsAcceptedAt: string | null;
      termsVersion: string | null;
    };
  }>("/me/accept-terms", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function getMyStatus() {
  return apiFetch<{
    success: true;
    hasLocalUser: boolean;
    user: {
      id: string;
      authUserId: string | null;
      email: string;
      name: string;
      timezone: string;
      termsAcceptedAt: string | null;
      termsVersion: string | null;
    } | null;
  }>("/me/status");
}