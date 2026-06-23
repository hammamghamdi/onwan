import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const BLOCK_DURATION_MS = 60 * 60 * 1000;
const DISTINCT_USERNAME_LIMIT = 5;

const blockedWarning = {
  ar: "محاولاتك تبدو مشبوهة. تم إيقاف الوصول مؤقتاً لمدة ساعة. قد يتم اتخاذ الإجراءات النظامية عند إساءة الاستخدام.",
  en: "Your activity appears suspicious. Access has been temporarily blocked for one hour. Legal action may be taken in case of misuse.",
  ur: "آپ کی سرگرمی مشکوک معلوم ہوتی ہے۔ رسائی کو عارضی طور پر ایک گھنٹے کے لیے روک دیا گیا ہے۔ غلط استعمال کی صورت میں قانونی کارروائی کی جا سکتی ہے۔",
  bn: "আপনার কার্যকলাপ সন্দেহজনক মনে হচ্ছে। এক ঘণ্টার জন্য প্রবেশাধিকার সাময়িকভাবে বন্ধ করা হয়েছে। অপব্যবহারের ক্ষেত্রে আইনি ব্যবস্থা নেওয়া হতে পারে।",
};

type PublicAddressRouteContext = {
  params: Promise<{
    username: string;
  }>;
};

type PublicAddress = {
  id: string;
  username: string;
  city: string | null;
  map_url: string | null;
  photo1: string | null;
  photo2: string | null;
  photo3: string | null;
  instructions_ar: string | null;
  instructions_en: string | null;
  instructions_ur: string | null;
  instructions_bn: string | null;
};

type PublicAddressPhoto = {
  url: string;
  caption: string | null;
};

const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

const getVisitorIp = (request: NextRequest) => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

  return (
    firstForwardedIp ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
};

const hashIp = (ip: string) => {
  const salt =
    process.env.RATE_LIMIT_HASH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "onwan-public-address-rate-limit";

  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
};

const blockedResponse = () =>
  NextResponse.json(
    {
      status: "blocked",
      warning: blockedWarning,
    },
    { status: 429 }
  );

export async function GET(
  request: NextRequest,
  context: PublicAddressRouteContext
) {
  const { username } = await context.params;
  const requestedUsername = username.trim();
  const ipHash = hashIp(getVisitorIp(request));
  const userAgent = request.headers.get("user-agent") || null;
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

  try {
    const supabase = getSupabaseAdmin();

    const { data: activeBlock, error: activeBlockError } = await supabase
      .from("public_address_blocks")
      .select("blocked_until")
      .eq("ip_hash", ipHash)
      .gt("blocked_until", now.toISOString())
      .order("blocked_until", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeBlockError) {
      console.error("Rate limit block check failed", activeBlockError);
      return NextResponse.json(
        { status: "error", message: "Unable to check address access" },
        { status: 500 }
      );
    }

    if (activeBlock) {
      return blockedResponse();
    }

    const { error: logError } = await supabase
      .from("public_address_access_logs")
      .insert({
        ip_hash: ipHash,
        username: requestedUsername,
        user_agent: userAgent,
      });

    if (logError) {
      console.error("Public address access log failed", logError);
      return NextResponse.json(
        { status: "error", message: "Unable to record address access" },
        { status: 500 }
      );
    }

    const { data: recentAccesses, error: recentAccessesError } = await supabase
      .from("public_address_access_logs")
      .select("username")
      .eq("ip_hash", ipHash)
      .gte("created_at", windowStart.toISOString());

    if (recentAccessesError) {
      console.error("Rate limit access count failed", recentAccessesError);
      return NextResponse.json(
        { status: "error", message: "Unable to check address access" },
        { status: 500 }
      );
    }

    const distinctUsernames = new Set(
      recentAccesses?.map((access) => access.username) || []
    );

    if (distinctUsernames.size >= DISTINCT_USERNAME_LIMIT) {
      const { error: blockError } = await supabase
        .from("public_address_blocks")
        .insert({
          ip_hash: ipHash,
          blocked_until: new Date(now.getTime() + BLOCK_DURATION_MS).toISOString(),
          reason: "Opened 5 different usernames within 5 minutes",
        });

      if (blockError) {
        console.error("Rate limit block insert failed", blockError);
        return NextResponse.json(
          { status: "error", message: "Unable to enforce address access limit" },
          { status: 500 }
        );
      }

      return blockedResponse();
    }

    const { data: address, error: addressError } = await supabase
      .from("profiles")
      .select(
        "id, username, city, map_url, photo1, photo2, photo3, instructions_ar, instructions_en, instructions_ur, instructions_bn"
      )
      .eq("username", requestedUsername)
      .single<PublicAddress>();

    if (addressError || !address) {
      return NextResponse.json({ status: "not_found" }, { status: 404 });
    }

    const { data: photoRows, error: photosError } = await supabase
      .from("address_photos")
      .select("storage_path, display_order, caption")
      .eq("profile_id", address.id)
      .order("display_order", { ascending: true });

    if (photosError) {
      console.error("Address photos lookup failed", photosError);
    }

    const normalizedPhotos: PublicAddressPhoto[] =
      photoRows?.map((photo) => {
        const { data } = supabase.storage
          .from("address-photos")
          .getPublicUrl(photo.storage_path);

        return {
          url: data.publicUrl,
          caption: photo.caption,
        };
      }) || [];

    const legacyPhotos: PublicAddressPhoto[] = [
      address.photo1,
      address.photo2,
      address.photo3,
    ]
      .filter(Boolean)
      .map((url) => ({
        url: url as string,
        caption: null,
      }));

    const publicPhotos =
      normalizedPhotos.length > 0 ? normalizedPhotos : legacyPhotos;

    const publicAddress = {
      username: address.username,
      city: address.city,
      map_url: address.map_url,
      photo1: address.photo1,
      photo2: address.photo2,
      photo3: address.photo3,
      instructions_ar: address.instructions_ar,
      instructions_en: address.instructions_en,
      instructions_ur: address.instructions_ur,
      instructions_bn: address.instructions_bn,
    };

    return NextResponse.json({
      status: "ok",
      address: {
        ...publicAddress,
        photo1: publicPhotos[0]?.url || publicAddress.photo1,
        photo2: publicPhotos[1]?.url || publicAddress.photo2,
        photo3: publicPhotos[2]?.url || publicAddress.photo3,
        photos: publicPhotos,
      },
    });
  } catch (error) {
    console.error("Public address route failed", error);
    return NextResponse.json(
      { status: "error", message: "Unable to load address" },
      { status: 500 }
    );
  }
}
