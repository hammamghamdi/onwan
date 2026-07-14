import { getSupabaseAdmin } from "@/lib/adminApi";
import { isValidUsername, normalizeUsername } from "@/lib/username";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Request-safety cap only; this is not a database schema limit.
const MAX_USERNAME_INPUT_LENGTH = 128;

type AvailabilityResponse = {
  available: boolean;
};

const availabilityResponse = (
  body: AvailabilityResponse,
  init?: ResponseInit
) =>
  NextResponse.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...init?.headers,
    },
  });

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return availabilityResponse({ available: false }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).length !== 1 ||
    !("username" in body)
  ) {
    return availabilityResponse({ available: false }, { status: 400 });
  }

  const rawUsername = (body as { username?: unknown }).username;

  if (typeof rawUsername !== "string") {
    return availabilityResponse({ available: false }, { status: 400 });
  }

  const username = normalizeUsername(rawUsername);

  if (
    username.length > MAX_USERNAME_INPUT_LENGTH ||
    !isValidUsername(username)
  ) {
    return availabilityResponse({ available: false }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .ilike("username", username)
      .maybeSingle<{ username: string }>();

    if (error) {
      return availabilityResponse({ available: false }, { status: 500 });
    }

    return availabilityResponse({ available: !data });
  } catch {
    return availabilityResponse({ available: false }, { status: 500 });
  }
}
