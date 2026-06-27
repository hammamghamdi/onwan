import { getSupabaseAdmin } from "@/lib/adminApi";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ProfileRow = {
  id: string;
  username: string;
  photo1: string | null;
  photo2: string | null;
  photo3: string | null;
};

type AddressPhotoRow = {
  storage_path: string | null;
};

const extractStoragePath = (url: string | null) => {
  if (!url) return null;

  const marker = "/storage/v1/object/public/address-photos/";
  const markerIndex = url.indexOf(marker);

  if (markerIndex === -1) return null;

  return decodeURIComponent(url.slice(markerIndex + marker.length));
};

export async function DELETE(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (user.email) {
    const { error: claimError } = await supabase
      .from("profiles")
      .update({ user_id: user.id })
      .eq("email", user.email.trim().toLowerCase())
      .is("user_id", null);

    if (claimError) {
      console.error("Account deletion ownership claim failed", claimError);
      return NextResponse.json({ message: "Unable to delete account" }, { status: 500 });
    }
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, photo1, photo2, photo3")
    .eq("user_id", user.id)
    .returns<ProfileRow[]>();

  if (profilesError) {
    console.error("Account deletion profile lookup failed", profilesError);
    return NextResponse.json({ message: "Unable to delete account" }, { status: 500 });
  }

  const profileIds = (profiles || []).map((profile) => profile.id);
  const usernames = (profiles || []).map((profile) => profile.username);
  const storagePaths = new Set<string>();

  for (const profile of profiles || []) {
    [profile.photo1, profile.photo2, profile.photo3].forEach((photoUrl) => {
      const storagePath = extractStoragePath(photoUrl);
      if (storagePath) storagePaths.add(storagePath);
    });
  }

  if (profileIds.length > 0) {
    const { data: addressPhotos, error: photosError } = await supabase
      .from("address_photos")
      .select("storage_path")
      .in("profile_id", profileIds)
      .returns<AddressPhotoRow[]>();

    if (photosError) {
      console.error("Account deletion photo lookup failed", photosError);
      return NextResponse.json({ message: "Unable to delete account" }, { status: 500 });
    }

    (addressPhotos || []).forEach((photo) => {
      if (photo.storage_path) storagePaths.add(photo.storage_path);
    });
  }

  if (storagePaths.size > 0) {
    const { error: storageError } = await supabase.storage
      .from("address-photos")
      .remove([...storagePaths]);

    if (storageError) {
      console.error("Account deletion storage cleanup failed", storageError);
      return NextResponse.json({ message: "Unable to delete account" }, { status: 500 });
    }
  }

  if (usernames.length > 0) {
    const { error: visitsError } = await supabase
      .from("address_visits")
      .delete()
      .in("username", usernames);

    if (visitsError) {
      console.error("Account deletion visit cleanup failed", visitsError);
      return NextResponse.json({ message: "Unable to delete account" }, { status: 500 });
    }
  }

  if (profileIds.length > 0) {
    const { error: deleteProfilesError } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", user.id);

    if (deleteProfilesError) {
      console.error("Account deletion profile cleanup failed", deleteProfilesError);
      return NextResponse.json({ message: "Unable to delete account" }, { status: 500 });
    }
  }

  const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);

  if (deleteUserError) {
    console.error("Account deletion auth cleanup failed", deleteUserError);
    return NextResponse.json({ message: "Unable to delete account" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
