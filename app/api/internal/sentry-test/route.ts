import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isAuthorized = (authorization: string | null, expectedSecret: string) => {
  const bearerPrefix = "Bearer ";

  if (!authorization?.startsWith(bearerPrefix)) {
    return false;
  }

  const suppliedSecret = authorization.slice(bearerPrefix.length);
  const suppliedBuffer = Buffer.from(suppliedSecret);
  const expectedBuffer = Buffer.from(expectedSecret);

  if (suppliedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(suppliedBuffer, expectedBuffer);
};

export async function POST(request: NextRequest) {
  if (process.env.SENTRY_TEST_ENABLED !== "true") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const expectedSecret = process.env.SENTRY_TEST_SECRET;

  if (!expectedSecret || !isAuthorized(request.headers.get("authorization"), expectedSecret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const error = new Error("Onwan controlled Sentry verification event");

  Sentry.withScope((scope) => {
    scope.setTag("verification", "controlled");
    scope.setTag("source", "temporary-server-endpoint");
    scope.addEventProcessor((event) => {
      delete event.request;
      delete event.user;
      delete event.breadcrumbs;

      return event;
    });

    Sentry.captureException(error);
  });

  const flushed = await Sentry.flush(2000);

  return NextResponse.json({ ok: true, flushed });
}
