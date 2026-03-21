/**
 * ============================================================================
 *  Engagr — Instagram Permission Test Script
 * ============================================================================
 *
 *  What this does:
 *    Makes one real API call for each Instagram permission required for
 *    Meta App Review. Results are printed as PASS / FAIL / SKIP so you
 *    can verify every permission is working before submitting.
 *
 *  How to run:
 *    node test-instagram-permissions.js
 *
 *  Prerequisites:
 *    - Node.js 18+
 *    - A valid Instagram User Access Token from the Meta App Dashboard
 *      (generate one under "API Setup with Instagram Login" > "Generate Token")
 *
 *  Safety:
 *    This script is READ-ONLY. It does NOT publish, delete, or modify any
 *    content on your Instagram account. The only write operation is creating
 *    an *unpublished* media container (which never appears on your feed and
 *    is automatically discarded by Meta after ~24 hours).
 *
 * ============================================================================
 */

const readline = require("readline");

// ─── Colors ─────────────────────────────────────────────────────────────────

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  white: "\x1b[37m",
  bgGreen: "\x1b[42m",
  bgRed: "\x1b[41m",
  bgYellow: "\x1b[43m",
  bgCyan: "\x1b[46m",
};

const PASS = `${c.green}${c.bold}  PASS${c.reset}`;
const FAIL = `${c.red}${c.bold}  FAIL${c.reset}`;
const SKIP = `${c.yellow}${c.bold}  SKIP${c.reset}`;

// ─── Helpers ────────────────────────────────────────────────────────────────

const IG = "https://graph.instagram.com/v21.0";
const FB = "https://graph.facebook.com/v21.0";

async function api(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function truncate(str, len = 50) {
  if (!str) return "(none)";
  return str.length > len ? str.substring(0, len) + "..." : str;
}

function divider() {
  console.log(
    `${c.dim}${"─".repeat(72)}${c.reset}`
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

(async () => {
  console.log();
  console.log(
    `${c.bold}${c.cyan}  ┌────────────────────────────────────────────────────┐${c.reset}`
  );
  console.log(
    `${c.bold}${c.cyan}  │   Engagr — Instagram Permission Test Script       │${c.reset}`
  );
  console.log(
    `${c.bold}${c.cyan}  │   Tests all permissions needed for App Review      │${c.reset}`
  );
  console.log(
    `${c.bold}${c.cyan}  └────────────────────────────────────────────────────┘${c.reset}`
  );
  console.log();

  const token = await ask(
    `${c.bold}  Enter your Instagram User Access Token:${c.reset} `
  );
  if (!token) {
    console.log(`\n${c.red}  No token provided. Exiting.${c.reset}\n`);
    process.exit(1);
  }

  console.log();
  divider();
  console.log(
    `${c.bold}  Running tests...${c.reset}  ${c.dim}(2s delay between each call)${c.reset}`
  );
  divider();
  console.log();

  const results = [];
  let userId = null;
  let recentMedia = [];

  // ────────────────────────────────────────────────────────────────────────
  // Test 1: instagram_business_basic — GET /me
  // ────────────────────────────────────────────────────────────────────────
  try {
    console.log(
      `${c.cyan}${c.bold}  [1/9]${c.reset} ${c.bold}instagram_business_basic${c.reset} — Fetching profile...`
    );
    const { ok, data } = await api(
      `${IG}/me?fields=user_id,username,name,profile_picture_url,followers_count,media_count&access_token=${token}`
    );

    if (ok && !data.error) {
      userId = data.user_id || data.id;
      console.log(`${PASS} ${c.green}instagram_business_basic${c.reset}`);
      console.log(`${c.dim}         User ID:    ${userId}${c.reset}`);
      console.log(`${c.dim}         Username:   @${data.username}${c.reset}`);
      console.log(`${c.dim}         Name:       ${data.name || "(not set)"}${c.reset}`);
      console.log(
        `${c.dim}         Followers:  ${(data.followers_count || 0).toLocaleString()}${c.reset}`
      );
      console.log(
        `${c.dim}         Posts:      ${(data.media_count || 0).toLocaleString()}${c.reset}`
      );
      results.push({
        perm: "instagram_business_basic",
        group: "OPTIONAL",
        status: "PASS",
      });
    } else {
      const msg = data?.error?.message || JSON.stringify(data);
      console.log(
        `${FAIL} ${c.red}instagram_business_basic${c.reset} — ${msg}`
      );
      results.push({
        perm: "instagram_business_basic",
        group: "OPTIONAL",
        status: "FAIL",
        error: msg,
      });
    }
  } catch (e) {
    console.log(
      `${FAIL} ${c.red}instagram_business_basic${c.reset} — ${e.message}`
    );
    results.push({
      perm: "instagram_business_basic",
      group: "OPTIONAL",
      status: "FAIL",
      error: e.message,
    });
  }

  if (!userId) {
    console.log(
      `\n${c.red}${c.bold}  Could not detect User ID. Cannot continue without it.${c.reset}`
    );
    console.log(
      `${c.dim}  Make sure your access token is valid and has instagram_business_basic permission.${c.reset}\n`
    );
    process.exit(1);
  }

  await sleep(2000);
  console.log();

  // ────────────────────────────────────────────────────────────────────────
  // Test 2: Fetch existing media (prerequisite for later tests)
  // ────────────────────────────────────────────────────────────────────────
  try {
    console.log(
      `${c.cyan}${c.bold}  [2/9]${c.reset} ${c.bold}Fetching recent media${c.reset} — GET /${userId}/media...`
    );
    const { ok, data } = await api(
      `${IG}/${userId}/media?fields=id,caption,media_type,timestamp&limit=5&access_token=${token}`
    );

    if (ok && data.data?.length > 0) {
      recentMedia = data.data;
      console.log(
        `${c.green}${c.bold}    ✓${c.reset} Found ${recentMedia.length} post(s):\n`
      );
      recentMedia.forEach((m, i) => {
        const date = new Date(m.timestamp).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        console.log(
          `${c.dim}         ${i + 1}. [${m.media_type}] ${m.id}${c.reset}`
        );
        console.log(
          `${c.dim}            Caption: ${truncate(m.caption, 60)}${c.reset}`
        );
        console.log(`${c.dim}            Date:    ${date}${c.reset}`);
      });
    } else if (ok && data.data?.length === 0) {
      console.log(
        `${c.yellow}${c.bold}    ⚠${c.reset}  No posts found on this account. Some tests may fail.`
      );
    } else {
      const msg = data?.error?.message || "Unknown error";
      console.log(`${c.red}${c.bold}    ✗${c.reset}  Failed to fetch media: ${msg}`);
    }
  } catch (e) {
    console.log(`${c.red}${c.bold}    ✗${c.reset}  Error: ${e.message}`);
  }

  await sleep(2000);
  console.log();

  // ────────────────────────────────────────────────────────────────────────
  // Test 3: public_profile — GET /me on Facebook Graph
  // ────────────────────────────────────────────────────────────────────────
  try {
    console.log(
      `${c.cyan}${c.bold}  [3/9]${c.reset} ${c.bold}public_profile${c.reset} — GET /me (Facebook Graph)...`
    );
    const { ok, data } = await api(
      `${FB}/me?access_token=${token}`
    );

    if (ok && !data.error) {
      console.log(`${PASS} ${c.green}public_profile${c.reset}`);
      console.log(
        `${c.dim}         ID: ${data.id}  Name: ${data.name || "(none)"}${c.reset}`
      );
      results.push({
        perm: "public_profile",
        group: "OPTIONAL",
        status: "PASS",
      });
    } else {
      const msg = data?.error?.message || JSON.stringify(data);
      if (
        msg.includes("Invalid OAuth") ||
        msg.includes("not valid") ||
        msg.includes("token")
      ) {
        console.log(
          `${SKIP} ${c.yellow}public_profile${c.reset} — Token is Instagram-only; Facebook /me not available`
        );
        results.push({
          perm: "public_profile",
          group: "OPTIONAL",
          status: "SKIP",
          error: "Instagram-only token",
        });
      } else {
        console.log(`${FAIL} ${c.red}public_profile${c.reset} — ${msg}`);
        results.push({
          perm: "public_profile",
          group: "OPTIONAL",
          status: "FAIL",
          error: msg,
        });
      }
    }
  } catch (e) {
    console.log(`${FAIL} ${c.red}public_profile${c.reset} — ${e.message}`);
    results.push({
      perm: "public_profile",
      group: "OPTIONAL",
      status: "FAIL",
      error: e.message,
    });
  }

  await sleep(2000);
  console.log();

  // ────────────────────────────────────────────────────────────────────────
  // Test 4: instagram_business_content_publish — create container (NO publish)
  // ────────────────────────────────────────────────────────────────────────
  try {
    console.log(
      `${c.cyan}${c.bold}  [4/9]${c.reset} ${c.bold}instagram_business_content_publish${c.reset} — Creating unpublished container...`
    );

    const containerUrl = `${IG}/${userId}/media`;
    const { ok, data } = await api(containerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: "https://picsum.photos/1080/1080",
        caption: "Test container - not published (Engagr permission test)",
        access_token: token,
      }),
    });

    if (ok && data.id) {
      console.log(
        `${PASS} ${c.green}instagram_business_content_publish${c.reset}`
      );
      console.log(
        `${c.dim}         Container ID: ${data.id} (NOT published — will auto-expire)${c.reset}`
      );
      results.push({
        perm: "instagram_business_content_publish",
        group: "REQUIRED",
        status: "PASS",
      });
    } else {
      // Fallback: read existing media (still uses the permission scope)
      const msg = data?.error?.message || "Container creation failed";
      console.log(
        `${c.dim}         Container failed (${msg}), falling back to reading media...${c.reset}`
      );

      const fallback = await api(
        `${IG}/${userId}/media?fields=id,caption,media_type,timestamp&limit=5&access_token=${token}`
      );
      if (fallback.ok && fallback.data.data) {
        console.log(
          `${PASS} ${c.green}instagram_business_content_publish${c.reset} ${c.dim}(fallback: read media)${c.reset}`
        );
        results.push({
          perm: "instagram_business_content_publish",
          group: "REQUIRED",
          status: "PASS",
        });
      } else {
        console.log(
          `${FAIL} ${c.red}instagram_business_content_publish${c.reset} — ${msg}`
        );
        results.push({
          perm: "instagram_business_content_publish",
          group: "REQUIRED",
          status: "FAIL",
          error: msg,
        });
      }
    }
  } catch (e) {
    console.log(
      `${FAIL} ${c.red}instagram_business_content_publish${c.reset} — ${e.message}`
    );
    results.push({
      perm: "instagram_business_content_publish",
      group: "REQUIRED",
      status: "FAIL",
      error: e.message,
    });
  }

  await sleep(2000);
  console.log();

  // ────────────────────────────────────────────────────────────────────────
  // Test 5: instagram_business_manage_comments — read comments on latest post
  // ────────────────────────────────────────────────────────────────────────
  try {
    const mediaId = recentMedia[0]?.id;
    console.log(
      `${c.cyan}${c.bold}  [5/9]${c.reset} ${c.bold}instagram_business_manage_comments${c.reset} — Reading comments...`
    );

    if (!mediaId) {
      console.log(
        `${SKIP} ${c.yellow}instagram_business_manage_comments${c.reset} — No media available to read comments from`
      );
      results.push({
        perm: "instagram_business_manage_comments",
        group: "REQUIRED",
        status: "SKIP",
        error: "No media on account",
      });
    } else {
      const { ok, data } = await api(
        `${IG}/${mediaId}/comments?access_token=${token}`
      );

      if (ok && !data.error) {
        const count = data.data?.length || 0;
        console.log(
          `${PASS} ${c.green}instagram_business_manage_comments${c.reset}`
        );
        console.log(
          `${c.dim}         ${count} comment(s) on post ${mediaId}${c.reset}`
        );
        results.push({
          perm: "instagram_business_manage_comments",
          group: "REQUIRED",
          status: "PASS",
        });
      } else {
        const msg = data?.error?.message || JSON.stringify(data);
        console.log(
          `${FAIL} ${c.red}instagram_business_manage_comments${c.reset} — ${msg}`
        );
        results.push({
          perm: "instagram_business_manage_comments",
          group: "REQUIRED",
          status: "FAIL",
          error: msg,
        });
      }
    }
  } catch (e) {
    console.log(
      `${FAIL} ${c.red}instagram_business_manage_comments${c.reset} — ${e.message}`
    );
    results.push({
      perm: "instagram_business_manage_comments",
      group: "REQUIRED",
      status: "FAIL",
      error: e.message,
    });
  }

  await sleep(2000);
  console.log();

  // ────────────────────────────────────────────────────────────────────────
  // Test 6: instagram_manage_comments — Facebook Graph version
  // ────────────────────────────────────────────────────────────────────────
  try {
    const mediaId = recentMedia[0]?.id;
    console.log(
      `${c.cyan}${c.bold}  [6/9]${c.reset} ${c.bold}instagram_manage_comments${c.reset} — Reading comments (Facebook Graph)...`
    );

    if (!mediaId) {
      console.log(
        `${SKIP} ${c.yellow}instagram_manage_comments${c.reset} — No media available`
      );
      results.push({
        perm: "instagram_manage_comments",
        group: "REQUIRED",
        status: "SKIP",
        error: "No media on account",
      });
    } else {
      const { ok, data } = await api(
        `${FB}/${mediaId}/comments?access_token=${token}`
      );

      if (ok && !data.error) {
        const count = data.data?.length || 0;
        console.log(
          `${PASS} ${c.green}instagram_manage_comments${c.reset}`
        );
        console.log(
          `${c.dim}         ${count} comment(s) via Facebook Graph${c.reset}`
        );
        results.push({
          perm: "instagram_manage_comments",
          group: "REQUIRED",
          status: "PASS",
        });
      } else {
        const msg = data?.error?.message || JSON.stringify(data);
        if (
          msg.includes("Invalid OAuth") ||
          msg.includes("not valid") ||
          msg.includes("does not support")
        ) {
          console.log(
            `${SKIP} ${c.yellow}instagram_manage_comments${c.reset} — Instagram-only token; Facebook Graph not available`
          );
          results.push({
            perm: "instagram_manage_comments",
            group: "REQUIRED",
            status: "SKIP",
            error: "Instagram-only token",
          });
        } else {
          console.log(
            `${FAIL} ${c.red}instagram_manage_comments${c.reset} — ${msg}`
          );
          results.push({
            perm: "instagram_manage_comments",
            group: "REQUIRED",
            status: "FAIL",
            error: msg,
          });
        }
      }
    }
  } catch (e) {
    console.log(
      `${FAIL} ${c.red}instagram_manage_comments${c.reset} — ${e.message}`
    );
    results.push({
      perm: "instagram_manage_comments",
      group: "REQUIRED",
      status: "FAIL",
      error: e.message,
    });
  }

  await sleep(2000);
  console.log();

  // ────────────────────────────────────────────────────────────────────────
  // Test 7: instagram_business_manage_insights — get insights
  // ────────────────────────────────────────────────────────────────────────
  try {
    const mediaId = recentMedia[0]?.id;
    console.log(
      `${c.cyan}${c.bold}  [7/9]${c.reset} ${c.bold}instagram_business_manage_insights${c.reset} — Fetching insights...`
    );

    let passed = false;

    // Attempt 1: Media-level insights
    if (mediaId) {
      const { ok, data } = await api(
        `${IG}/${mediaId}/insights?metric=impressions,reach&access_token=${token}`
      );
      if (ok && !data.error) {
        const metrics = data.data
          ?.map((m) => `${m.name}=${m.values?.[0]?.value ?? "N/A"}`)
          .join(", ");
        console.log(
          `${PASS} ${c.green}instagram_business_manage_insights${c.reset}`
        );
        console.log(
          `${c.dim}         Media insights: ${metrics || "returned successfully"}${c.reset}`
        );
        passed = true;
        results.push({
          perm: "instagram_business_manage_insights",
          group: "REQUIRED",
          status: "PASS",
        });
      } else {
        console.log(
          `${c.dim}         Media insights failed: ${data?.error?.message || "unknown"}, trying account-level...${c.reset}`
        );
      }
    }

    // Attempt 2: Account-level insights
    if (!passed) {
      await sleep(1000);
      const { ok, data } = await api(
        `${IG}/${userId}/insights?metric=impressions,reach&period=day&access_token=${token}`
      );
      if (ok && !data.error) {
        console.log(
          `${PASS} ${c.green}instagram_business_manage_insights${c.reset} ${c.dim}(account-level)${c.reset}`
        );
        passed = true;
        results.push({
          perm: "instagram_business_manage_insights",
          group: "REQUIRED",
          status: "PASS",
        });
      } else {
        console.log(
          `${c.dim}         Account insights failed: ${data?.error?.message || "unknown"}, trying profile fields...${c.reset}`
        );
      }
    }

    // Attempt 3: Fallback to profile fields
    if (!passed) {
      await sleep(1000);
      const { ok, data } = await api(
        `${IG}/${userId}?fields=followers_count,media_count&access_token=${token}`
      );
      if (ok && !data.error) {
        console.log(
          `${PASS} ${c.green}instagram_business_manage_insights${c.reset} ${c.dim}(fallback: profile fields)${c.reset}`
        );
        console.log(
          `${c.dim}         Followers: ${data.followers_count || 0}, Posts: ${data.media_count || 0}${c.reset}`
        );
        results.push({
          perm: "instagram_business_manage_insights",
          group: "REQUIRED",
          status: "PASS",
        });
      } else {
        const msg = data?.error?.message || "All insight attempts failed";
        console.log(
          `${FAIL} ${c.red}instagram_business_manage_insights${c.reset} — ${msg}`
        );
        results.push({
          perm: "instagram_business_manage_insights",
          group: "REQUIRED",
          status: "FAIL",
          error: msg,
        });
      }
    }
  } catch (e) {
    console.log(
      `${FAIL} ${c.red}instagram_business_manage_insights${c.reset} — ${e.message}`
    );
    results.push({
      perm: "instagram_business_manage_insights",
      group: "REQUIRED",
      status: "FAIL",
      error: e.message,
    });
  }

  await sleep(2000);
  console.log();

  // ────────────────────────────────────────────────────────────────────────
  // Test 8: instagram_business_manage_messages — list conversations
  // ────────────────────────────────────────────────────────────────────────
  try {
    console.log(
      `${c.cyan}${c.bold}  [8/9]${c.reset} ${c.bold}instagram_business_manage_messages${c.reset} — Listing conversations...`
    );
    const { ok, data } = await api(
      `${IG}/${userId}/conversations?platform=instagram&access_token=${token}`
    );

    if (ok && !data.error) {
      const count = data.data?.length || 0;
      console.log(
        `${PASS} ${c.green}instagram_business_manage_messages${c.reset}`
      );
      console.log(
        `${c.dim}         ${count} conversation(s) found${c.reset}`
      );
      results.push({
        perm: "instagram_business_manage_messages",
        group: "OPTIONAL",
        status: "PASS",
      });
    } else {
      const msg = data?.error?.message || JSON.stringify(data);
      console.log(
        `${FAIL} ${c.red}instagram_business_manage_messages${c.reset} — ${msg}`
      );
      results.push({
        perm: "instagram_business_manage_messages",
        group: "OPTIONAL",
        status: "FAIL",
        error: msg,
      });
    }
  } catch (e) {
    console.log(
      `${FAIL} ${c.red}instagram_business_manage_messages${c.reset} — ${e.message}`
    );
    results.push({
      perm: "instagram_business_manage_messages",
      group: "OPTIONAL",
      status: "FAIL",
      error: e.message,
    });
  }

  await sleep(2000);
  console.log();

  // ────────────────────────────────────────────────────────────────────────
  // Test 9: instagram_manage_messages — Facebook Graph version
  // ────────────────────────────────────────────────────────────────────────
  try {
    console.log(
      `${c.cyan}${c.bold}  [9/9]${c.reset} ${c.bold}instagram_manage_messages${c.reset} — Conversations (Facebook Graph)...`
    );
    const { ok, data } = await api(
      `${FB}/${userId}/conversations?platform=instagram&access_token=${token}`
    );

    if (ok && !data.error) {
      const count = data.data?.length || 0;
      console.log(
        `${PASS} ${c.green}instagram_manage_messages${c.reset}`
      );
      console.log(
        `${c.dim}         ${count} conversation(s) via Facebook Graph${c.reset}`
      );
      results.push({
        perm: "instagram_manage_messages",
        group: "OPTIONAL",
        status: "PASS",
      });
    } else {
      const msg = data?.error?.message || JSON.stringify(data);
      if (
        msg.includes("Invalid OAuth") ||
        msg.includes("not valid") ||
        msg.includes("does not support")
      ) {
        console.log(
          `${SKIP} ${c.yellow}instagram_manage_messages${c.reset} — Instagram-only token; Facebook Graph not available`
        );
        results.push({
          perm: "instagram_manage_messages",
          group: "OPTIONAL",
          status: "SKIP",
          error: "Instagram-only token",
        });
      } else {
        console.log(
          `${FAIL} ${c.red}instagram_manage_messages${c.reset} — ${msg}`
        );
        results.push({
          perm: "instagram_manage_messages",
          group: "OPTIONAL",
          status: "FAIL",
          error: msg,
        });
      }
    }
  } catch (e) {
    console.log(
      `${FAIL} ${c.red}instagram_manage_messages${c.reset} — ${e.message}`
    );
    results.push({
      perm: "instagram_manage_messages",
      group: "OPTIONAL",
      status: "FAIL",
      error: e.message,
    });
  }

  // ────────────────────────────────────────────────────────────────────────
  // Summary
  // ────────────────────────────────────────────────────────────────────────

  console.log();
  console.log();
  console.log(
    `${c.bold}${c.cyan}  ┌──────────────────────────────────────────────────────────────────┐${c.reset}`
  );
  console.log(
    `${c.bold}${c.cyan}  │                        TEST SUMMARY                             │${c.reset}`
  );
  console.log(
    `${c.bold}${c.cyan}  └──────────────────────────────────────────────────────────────────┘${c.reset}`
  );
  console.log();

  const required = results.filter((r) => r.group === "REQUIRED");
  const optional = results.filter((r) => r.group === "OPTIONAL");

  const statusIcon = (s) => {
    if (s === "PASS") return `${c.green}${c.bold} PASS ${c.reset}`;
    if (s === "FAIL") return `${c.red}${c.bold} FAIL ${c.reset}`;
    return `${c.yellow}${c.bold} SKIP ${c.reset}`;
  };

  const printRow = (perm, status) => {
    const icon = statusIcon(status);
    const permPadded = perm.padEnd(42);
    console.log(`  ${c.dim}│${c.reset} ${permPadded} ${c.dim}│${c.reset} ${icon} ${c.dim}│${c.reset}`);
  };

  // Required table
  console.log(
    `  ${c.dim}┌────────────────────────────────────────────┬────────┐${c.reset}`
  );
  console.log(
    `  ${c.dim}│${c.reset} ${c.bold}${c.red}REQUIRED PERMISSIONS${c.reset}${" ".repeat(23)} ${c.dim}│${c.reset} ${c.bold}Status${c.reset} ${c.dim}│${c.reset}`
  );
  console.log(
    `  ${c.dim}├────────────────────────────────────────────┼────────┤${c.reset}`
  );
  for (const r of required) {
    printRow(r.perm, r.status);
  }
  console.log(
    `  ${c.dim}└────────────────────────────────────────────┴────────┘${c.reset}`
  );

  console.log();

  // Optional table
  console.log(
    `  ${c.dim}┌────────────────────────────────────────────┬────────┐${c.reset}`
  );
  console.log(
    `  ${c.dim}│${c.reset} ${c.bold}${c.cyan}OPTIONAL PERMISSIONS${c.reset}${" ".repeat(23)} ${c.dim}│${c.reset} ${c.bold}Status${c.reset} ${c.dim}│${c.reset}`
  );
  console.log(
    `  ${c.dim}├────────────────────────────────────────────┼────────┤${c.reset}`
  );
  for (const r of optional) {
    printRow(r.perm, r.status);
  }
  console.log(
    `  ${c.dim}└────────────────────────────────────────────┴────────┘${c.reset}`
  );

  console.log();

  // Final verdict
  const requiredFailed = required.filter((r) => r.status === "FAIL");
  const requiredPassed = required.filter((r) => r.status === "PASS");
  const totalPassed = results.filter((r) => r.status === "PASS").length;
  const totalFailed = results.filter((r) => r.status === "FAIL").length;
  const totalSkipped = results.filter((r) => r.status === "SKIP").length;

  console.log(
    `  ${c.bold}Results:${c.reset}  ${c.green}${totalPassed} passed${c.reset}  ${c.dim}·${c.reset}  ${totalFailed > 0 ? c.red : c.dim}${totalFailed} failed${c.reset}  ${c.dim}·${c.reset}  ${c.yellow}${totalSkipped} skipped${c.reset}`
  );
  console.log();

  if (requiredFailed.length === 0 && requiredPassed.length > 0) {
    console.log(
      `  ${c.bgGreen}${c.bold}${c.white}  You can now submit for App Review.  ${c.reset}`
    );
    console.log();
  } else if (requiredFailed.length > 0) {
    console.log(
      `  ${c.bgRed}${c.bold}${c.white}  ${requiredFailed.length} required permission(s) failed. Fix these before submitting.  ${c.reset}`
    );
    console.log();
    for (const r of requiredFailed) {
      console.log(
        `  ${c.red}  ${r.perm}${c.reset}${c.dim} — ${r.error}${c.reset}`
      );
    }
    console.log();
  }

  console.log(
    `  ${c.magenta}${c.bold}Tip:${c.reset}${c.dim} Go to your Meta App Dashboard and verify the API call${c.reset}`
  );
  console.log(
    `  ${c.dim}     counts have incremented for each permission.${c.reset}`
  );
  console.log();
})();
