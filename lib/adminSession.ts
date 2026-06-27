import { scryptSync, timingSafeEqual, createHmac } from "crypto";

export const adminSessionCookieName = "onwan_admin_session";

const sessionDurationMs = 8 * 60 * 60 * 1000;

const getAdminIdentifier = () => {
  const username = process.env.ADMIN_USERNAME?.trim();
  if (username) return username.toLowerCase();

  const emailFromList = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim())
    .find(Boolean);

  return (emailFromList || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
};

const getSessionSecret = () => process.env.ADMIN_SESSION_SECRET || "";

const sign = (value: string) => {
  const secret = getSessionSecret();
  if (!secret) throw new Error("Missing ADMIN_SESSION_SECRET");
  return createHmac("sha256", secret).update(value).digest("base64url");
};

export const getConfiguredAdminIdentifier = getAdminIdentifier;

export const verifyAdminPassword = (password: string) => {
  const hash = process.env.ADMIN_PASSWORD_HASH || "";
  const [scheme, cost, blockSize, parallelization, saltHex, hashHex] =
    hash.split("$");

  if (
    scheme !== "scrypt" ||
    !cost ||
    !blockSize ||
    !parallelization ||
    !saltHex ||
    !hashHex
  ) {
    return false;
  }

  try {
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length, {
      N: Number(cost),
      r: Number(blockSize),
      p: Number(parallelization),
    });

    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
};

export const createAdminSessionToken = (adminIdentifier: string) => {
  const payload = Buffer.from(
    JSON.stringify({
      sub: adminIdentifier,
      exp: Date.now() + sessionDurationMs,
    })
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
};

export const verifyAdminSessionToken = (token?: string) => {
  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  try {
    const expectedSignature = sign(payload);
    const expectedBuffer = Buffer.from(expectedSignature);
    const actualBuffer = Buffer.from(signature);

    if (
      expectedBuffer.length !== actualBuffer.length ||
      !timingSafeEqual(expectedBuffer, actualBuffer)
    ) {
      return false;
    }

    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as {
      sub?: string;
      exp?: number;
    };

    const adminIdentifier = getAdminIdentifier();

    return (
      Boolean(adminIdentifier) &&
      session.sub === adminIdentifier &&
      typeof session.exp === "number" &&
      session.exp > Date.now()
    );
  } catch {
    return false;
  }
};
