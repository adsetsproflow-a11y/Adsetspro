import { NextRequest, NextResponse } from 'next/server';
import { revokeRefreshToken, clearAuthCookies } from '@/lib/security/jwt';
import { getAuthenticatedUser, recordAuditLog } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const refreshToken = request.cookies.get('saas_refresh_token')?.value;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    if (user) {
      await recordAuditLog({
        actorUserId: user.userId,
        companyId: user.activeMembership?.companyId,
        action: 'AUTH_LOGOUT',
        targetType: 'USER',
        targetId: user.userId,
      });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully.',
    });

    clearAuthCookies(response);

    return response;
  } catch (error: any) {
    console.error('[API Logout Error]', error);
    const response = NextResponse.json({ success: true, message: 'Logged out.' });
    clearAuthCookies(response);
    return response;
  }
}
