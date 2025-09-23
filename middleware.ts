import { headers as _headers } from "next/headers";
import {
  type MiddlewareConfig,
  type NextRequest,
  NextResponse,
} from "next/server";
import { auth } from "@/utils/auth";
import { getOrganizationRedirect } from "./server/get-organization-redirect";

export async function middleware(request: NextRequest) {
  const headers = await _headers();

  const session = await auth.api.getSession({ headers });

  if (!session && request.nextUrl.pathname !== "/sign-in") {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (
    session &&
    (request.nextUrl.pathname === "/" ||
      request.nextUrl.pathname === "/sign-in")
  ) {
    const redirectUrl = await getOrganizationRedirect({ headers });

    return NextResponse.redirect(new URL(`/${redirectUrl}`, request.url));
  }

  return NextResponse.next();
}

export const config: MiddlewareConfig = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!py-api|docs|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    "/",
    "/new",
    "/o/:path*",
  ],
};
