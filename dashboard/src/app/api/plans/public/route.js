import { NextResponse } from "next/server";
import { getPlanConfig, getPlansForDisplay } from "@/lib/planConfig";

export async function GET() {
  try {
    const config = await getPlanConfig();
    const plans = await getPlansForDisplay();
    return NextResponse.json({
      plans,
      display: config.display,
      earlyAccess: { enabled: config.earlyAccess?.enabled },
    });
  } catch (error) {
    console.error("[Plans API] Error:", error.message);
    return NextResponse.json({ error: "Failed to load plans" }, { status: 500 });
  }
}
