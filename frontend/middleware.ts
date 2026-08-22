import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/signup", "/verify-email"];

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
