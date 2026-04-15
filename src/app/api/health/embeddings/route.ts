import { NextResponse } from "next/server";
import { embeddingsHealthcheck } from "@/lib/gemini";

export async function GET() {
  try {
    const health = await embeddingsHealthcheck();
    return NextResponse.json({ status: "ok", ...health });
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
