import {
  GET as getAddresses,
  PATCH as patchAddress,
} from "@/app/api/admin/addresses/route";

export const runtime = "nodejs";

export const GET = getAddresses;
export const PATCH = patchAddress;
