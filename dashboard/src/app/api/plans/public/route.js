import { NextResponse } from "next/server";
import { getPlanConfig, getPlansForDisplay } from "@/lib/planConfig";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountType = searchParams.get("type") || "creator";
    const config = await getPlanConfig();
    const plans = await getPlansForDisplay(accountType);
    return NextResponse.json({
      plans,
      accountType,
      display: config.display,
      earlyAccess: { enabled: config.earlyAccess?.enabled },
    });
  } catch (error) {
    console.error("[Plans API] Error:", error.message);
    return NextResponse.json({ error: "Failed to load plans" }, { status: 500 });
  }
}
