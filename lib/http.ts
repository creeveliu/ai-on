import { NextRequest, NextResponse } from "next/server";

export function wantsJson(req: NextRequest) {
  const accept = req.headers.get("accept") ?? "";
  const contentType = req.headers.get("content-type") ?? "";
  return accept.includes("application/json") || contentType.includes("application/json");
}

export function redirectTo(req: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, req.url));
}
