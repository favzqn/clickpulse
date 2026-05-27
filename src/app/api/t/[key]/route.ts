import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const trackingKey = key.replace(/\.js$/, "");

  if (!/^[a-f0-9]+$/.test(trackingKey)) {
    return new NextResponse("Invalid key", { status: 400 });
  }

  const scriptPath = join(
    process.cwd(),
    "packages/tracker/dist/clickpulse.js"
  );

  if (!existsSync(scriptPath)) {
    return new NextResponse("Script not built", { status: 500 });
  }

  const script = readFileSync(scriptPath, "utf-8");

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
