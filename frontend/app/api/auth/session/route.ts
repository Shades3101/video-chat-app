import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json(
                { error: "Token is required" },
                { status: 400 }
            );
        }

        const cookieStore = await cookies();

        // Set the cookie on the frontend domain
        cookieStore.set("access_token", token, {
            httpOnly: true,
            secure: true, // Always secure in production
            sameSite: "lax", // Lax is fine for same-domain (frontend -> frontend)
            path: "/",
            maxAge: 8 * 60 * 60, // 8 hours in seconds
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Session creation error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
