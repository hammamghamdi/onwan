import { getSupabaseAdmin } from "@/lib/adminApi";
import { isValidUsername, normalizeUsername } from "@/lib/username";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type AddressRouteContext = {
  params: Promise<{
    username: string;
  }>;
};

type OwnedAddressRow = {
  username: string;
  display_username: string | null;
  city: string | null;
  map_url: string | null;
  instructions_ar: string | null;
  is_suspended: boolean | null;
  suspended_reason: string | null;
};

type UpdatePayload = {
  city?: unknown;
  mapUrl?: unknown;
  instructions?: unknown;
};

const jsonResponse = (
  body: Record<string, unknown>,
  init?: ResponseInit
) => {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");

  return NextResponse.json(body, {
    ...init,
    headers,
  });
};

const unauthorizedResponse = () =>
  jsonResponse({ message: "Unauthorized" }, { status: 401 });

const notFoundResponse = () =>
  jsonResponse({ message: "Address not found" }, { status: 404 });

const badRequestResponse = () =>
  jsonResponse({ message: "Invalid request" }, { status: 400 });

const extractUrl = (value: string) =>
  value.match(/https?:\/\/\S+/)?.[0]?.trim() || "";

const getAuthenticatedUser = async (request: NextRequest) => {
  const authHeader = request.headers.get("authorization") || "";
  const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);

  if (!tokenMatch?.[1]?.trim()) {
    return {
      authenticated: false as const,
      response: unauthorizedResponse(),
    };
  }

  const supabase = getSupabaseAdmin();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(tokenMatch[1].trim());

  if (error || !user) {
    return {
      authenticated: false as const,
      response: unauthorizedResponse(),
    };
  }

  return {
    authenticated: true as const,
    supabase,
    userId: user.id,
  };
};

const getNormalizedRouteUsername = async (context: AddressRouteContext) => {
  const { username: rawUsername } = await context.params;
  const username = normalizeUsername(rawUsername || "");

  if (!isValidUsername(username)) {
    return null;
  }

  return username;
};

export async function GET(request: NextRequest, context: AddressRouteContext) {
  try {
    const authResult = await getAuthenticatedUser(request);

    if (!authResult.authenticated) {
      return authResult.response;
    }

    const username = await getNormalizedRouteUsername(context);

    if (!username) {
      return notFoundResponse();
    }

    const { data, error } = await authResult.supabase
      .from("profiles")
      .select(
        "username, display_username, city, map_url, instructions_ar, is_suspended, suspended_reason"
      )
      .ilike("username", username)
      .eq("user_id", authResult.userId)
      .maybeSingle<OwnedAddressRow>();

    if (error) {
      return jsonResponse(
        { message: "Unable to load address" },
        { status: 500 }
      );
    }

    if (!data) {
      return notFoundResponse();
    }

    return jsonResponse({
      address: {
        username: data.username,
        displayUsername: data.display_username || data.username,
        city: data.city || "",
        mapUrl: data.map_url || "",
        instructions: data.instructions_ar || "",
        isSuspended: Boolean(data.is_suspended),
        suspendedReason: data.suspended_reason || null,
      },
    });
  } catch {
    return jsonResponse(
      { message: "Unable to load address" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: AddressRouteContext) {
  try {
    const authResult = await getAuthenticatedUser(request);

    if (!authResult.authenticated) {
      return authResult.response;
    }

    const username = await getNormalizedRouteUsername(context);

    if (!username) {
      return notFoundResponse();
    }

    let parsedBody: unknown;

    try {
      parsedBody = await request.json();
    } catch {
      return badRequestResponse();
    }

    if (
      parsedBody === null ||
      typeof parsedBody !== "object" ||
      Array.isArray(parsedBody)
    ) {
      return badRequestResponse();
    }

    const payload = parsedBody as UpdatePayload;
    const payloadKeys = Object.keys(payload);
    const allowedKeys = new Set(["city", "mapUrl", "instructions"]);
    const cityValue = payload.city;
    const mapUrlValue = payload.mapUrl;
    const instructionsValue = payload.instructions;

    if (
      payloadKeys.length !== 3 ||
      payloadKeys.some((key) => !allowedKeys.has(key)) ||
      typeof cityValue !== "string" ||
      typeof mapUrlValue !== "string" ||
      typeof instructionsValue !== "string"
    ) {
      return badRequestResponse();
    }

    const city = cityValue.trim();
    const mapUrl = mapUrlValue.trim();
    const instructions = instructionsValue.trim();
    const cleanedMapUrl = extractUrl(mapUrl);

    if (!city || !mapUrl || !cleanedMapUrl || !instructions) {
      return badRequestResponse();
    }

    const { data, error } = await authResult.supabase
      .from("profiles")
      .update({
        city,
        map_url: cleanedMapUrl,
        instructions_ar: instructions,
        instructions_en: instructions,
        instructions_ur: instructions,
        instructions_bn: instructions,
      })
      .ilike("username", username)
      .eq("user_id", authResult.userId)
      .select("username")
      .maybeSingle<{ username: string }>();

    if (error) {
      return jsonResponse(
        { message: "Unable to update address" },
        { status: 500 }
      );
    }

    if (!data) {
      return notFoundResponse();
    }

    return jsonResponse({ success: true });
  } catch {
    return jsonResponse(
      { message: "Unable to update address" },
      { status: 500 }
    );
  }
}
