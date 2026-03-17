import { NextResponse } from "next/server";

export function GET(request) {
  const url = new URL("/", request.url);
  const response = NextResponse.redirect(url);
  response.cookies.delete("auth_token");
  return response;
}
