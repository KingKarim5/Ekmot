/**
 * Small helper for Ekmot API routes: reads the Bearer token and returns the
 * signed-in user's id and role, or null.
 */

import { NextRequest } from "next/server";
import { parseToken } from "@/utils/auth";

export function getRequester(request: NextRequest): { userId: string; role: string } | null {
  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) return null;
  return parseToken(header.substring(7));
}
