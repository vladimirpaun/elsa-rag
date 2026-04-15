import { NextResponse } from "next/server";
import { databaseStats } from "@/lib/storage";

export async function GET() {
  try {
    const stats = await databaseStats();
    return NextResponse.json({ status: "ok", ...stats });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
