import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import InstagramAccount from '@/models/InstagramAccount';

const IG_BASE = 'https://graph.instagram.com';

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
        expiresIn: data.expires_in || 5184000,
    };
}

// GET /api/cron/refresh-tokens
// Called by Vercel Cron (daily). Refreshes tokens expiring within 10 days.
// Now iterates InstagramAccounts instead of Users.
export async function GET(request) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    await dbConnect();

    const tenDaysFromNow = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

    // Find InstagramAccounts with expiring tokens
    const accountsToRefresh = await InstagramAccount.find({
        isConnected: true,
        tokenExpired: false,
        accessToken: { $exists: true, $ne: null },
        $or: [
            { tokenExpiresAt: { $lte: tenDaysFromNow } },
            { tokenExpiresAt: { $exists: false } },
        ],
    });

    console.log(`[Cron] Found ${accountsToRefresh.length} InstagramAccount tokens to refresh`);

    const results = { refreshed: 0, failed: 0, errors: [] };

    for (const account of accountsToRefresh) {
        try {
            const { accessToken, expiresIn } = await refreshToken(account.accessToken);
            const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

            await InstagramAccount.findByIdAndUpdate(account._id, {
                accessToken,
                tokenExpiresAt,
                tokenExpired: false,
            });

            // Keep legacy User in sync if this is the primary account
            if (account.isPrimary) {
                await User.findOneAndUpdate(
                    { userId: account.userId },
                    {
                        instagramAccessToken: accessToken,
                        tokenExpiresAt,
                        tokenExpired: false,
                    }
                );
            }

            console.log(`[Cron] Refreshed token for @${account.instagramUsername} — expires ${tokenExpiresAt.toISOString()}`);
            results.refreshed++;
        } catch (err) {
            console.error(`[Cron] Failed to refresh token for @${account.instagramUsername}:`, err.message);

            if (err.message.includes('expired') || err.message.includes('invalid')) {
                await InstagramAccount.findByIdAndUpdate(account._id, {
                    isConnected: false,
                    tokenExpired: true,
                    'automation.isActive': false,
                });

                if (account.isPrimary) {
                    await User.findOneAndUpdate(
                        { userId: account.userId },
                        { isConnected: false, tokenExpired: true }
                    );
                }
            }

            results.failed++;
            results.errors.push({ username: account.instagramUsername, error: err.message });
        }
    }

    console.log(`[Cron] Done — refreshed: ${results.refreshed}, failed: ${results.failed}`);

    return NextResponse.json({
        success: true,
        ...results,
        timestamp: new Date().toISOString(),
    });
}
