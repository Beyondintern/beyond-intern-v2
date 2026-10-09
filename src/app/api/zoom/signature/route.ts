import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    // Signature tokens grant Zoom meeting access — require a session.
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { meetingNumber, role } = await request.json();

    // role: 0 = attendee, 1 = host. Only allow attendee tokens from the public API;
    // host tokens must never be minted through an unauthenticated request.
    const normalizedRole = Number(role);
    if (!meetingNumber || role === undefined || Number.isNaN(normalizedRole) || normalizedRole !== 0) {
      return NextResponse.json(
        { error: "meetingNumber and role are required" },
        { status: 400 }
      );
    }

    const sdkKey = process.env.ZOOM_SDK_KEY;
    const sdkSecret = process.env.ZOOM_SDK_SECRET;

    if (!sdkKey || !sdkSecret) {
      return NextResponse.json(
        { error: "Zoom SDK credentials are not configured" },
        { status: 500 }
      );
    }

    const iat = Math.round(Date.now() / 1000) - 30;
    const exp = iat + 60 * 60 * 2; // Token valid for 2 hours
    const tokenExp = exp;

    // Header
    const oHeader = { alg: "HS256", typ: "JWT" };

    // Payload
    const oPayload = {
      sdkKey,
      mn: String(meetingNumber),
      role: normalizedRole,
      iat,
      exp,
      tokenExp,
    };

    // Base64URL encode helper
    function base64url(source: string): string {
      let encodedSource = Buffer.from(source).toString("base64");
      // Remove padding '='
      encodedSource = encodedSource.replace(/=+$/, "");
      // Replace URL-unsafe chars
      encodedSource = encodedSource.replace(/\+/g, "-");
      encodedSource = encodedSource.replace(/\//g, "_");
      return encodedSource;
    }

    const sHeader = base64url(JSON.stringify(oHeader));
    const sPayload = base64url(JSON.stringify(oPayload));

    const signature = crypto
      .createHmac("sha256", sdkSecret)
      .update(`${sHeader}.${sPayload}`)
      .digest("base64")
      .replace(/=+$/, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const sdkJWT = `${sHeader}.${sPayload}.${signature}`;

    return NextResponse.json({ signature: sdkJWT });
  } catch (error) {
    console.error("Zoom signature generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate signature" },
      { status: 500 }
    );
  }
}
