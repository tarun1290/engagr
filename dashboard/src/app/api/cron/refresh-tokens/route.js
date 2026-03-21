import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

const IG_BASE = 'https://graph.instagram.com';

// Refresh a long-lived Instagram token before it expires.
// Returns a new long-lived token valid for another 60 days.
async function refreshToken(currentToken) {
    const url = new URL(`${IG_BASE}/refresh_access_token`);
    url.searchParams.set('grant_type', 'ig_refresh_token');
    url.searchParams.set('access_token', currentToken);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.error) {
        throw new Error(data.error.message || 'Token refresh failed');
    }

    return {
        accessToken: data.access_token,
        expiresIn: data.expires_in || 5184000, // 60 days
    };
}

// GET /api/cron/refresh-tokens
// Called by Vercel Cron (daily). Refreshes tokens expiring within 10 days.
// Protected by Vercel's cron secret header or CRON_SECRET env var.
export async function GET(request) {
    // Verify the request is from Vercel Cron or an authorized caller
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    await dbConnect();

    // Find all connected users whose tokens expire within the next 10 days
    const tenDaysFromNow = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

    const usersToRefresh = await User.find({
        isConnected: true,
        tokenExpired: false,
        instagramAccessToken: { $exists: true, $ne: null },
        $or: [
            { tokenExpiresAt: { $lte: tenDaysFromNow } },
            // Also catch users without tokenExpiresAt (legacy records)
            { tokenExpiresAt: { $exists: false } },
        ],
    });

    console.log(`[Cron] Found ${usersToRefresh.length} tokens to refresh`);

    const results = { refreshed: 0, failed: 0, errors: [] };

    for (const user of usersToRefresh) {
        try {
            const { accessToken, expiresIn } = await refreshToken(user.instagramAccessToken);
            const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

            await User.findByIdAndUpdate(user._id, {
                instagramAccessToken: accessToken,
                tokenExpiresAt,
                tokenExpired: false,
            });

            console.log(`[Cron] Refreshed token for @${user.instagramUsername} — expires ${tokenExpiresAt.toISOString()}`);
            results.refreshed++;
        } catch (err) {
            console.error(`[Cron] Failed to refresh token for @${user.instagramUsername}:`, err.message);

            // If token is truly expired (can't refresh), mark it
            if (err.message.includes('expired') || err.message.includes('invalid')) {
                await User.findByIdAndUpdate(user._id, {
                    isConnected: false,
                    tokenExpired: true,
                });
            }

            results.failed++;
            results.errors.push({ username: user.instagramUsername, error: err.message });
        }
    }

    console.log(`[Cron] Done — refreshed: ${results.refreshed}, failed: ${results.failed}`);

    return NextResponse.json({
        success: true,
        ...results,
        timestamp: new Date().toISOString(),
    });
}
