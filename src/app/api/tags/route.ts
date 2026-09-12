import { NextResponse } from "next/server";
import { getTags, createTag } from "@/lib/db/tag-repository";

export async function GET(request: Request) {
  try {
    const tags = await getTags();
    return NextResponse.json(tags);
  } catch (error) {
    console.error("GET /api/tags error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "Invalid tag name" }, { status: 400 });
    }

    const tag = await createTag(body.name, body.color);
    
    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("POST /api/tags error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
