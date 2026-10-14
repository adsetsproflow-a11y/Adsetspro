import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  rotateRefreshTokenSession,
  signAccessToken,
  setAuthCookies,
  clearAuthCookies,
} from '@/lib/security/jwt';
import { MembershipStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    let rawRefreshToken = request.cookies.get('saas_refresh_token')?.value;

    if (!rawRefreshToken) {
      try {
        const body = await request.json();
        rawRefreshToken = body.refreshToken;
      } catch {}
    }

    if (!rawRefreshToken) {
      return NextResponse.json(
        { success: false, error: 'No refresh token provided.' },
        { status: 400 }
      );
    }

    const rotationResult = await rotateRefreshTokenSession(rawRefreshToken);

    if (!rotationResult.success || !rotationResult.newRawToken || !rotationResult.userId) {
      const response = NextResponse.json(
        { success: false, error: rotationResult.error || 'Invalid or expired refresh token.' },
        { status: 401 }
      );
      clearAuthCookies(response);
      return response;
    }

    // Load fresh user data for the access token payload
    const user = await prisma.user.findUnique({
      where: { id: rotationResult.userId },
      include: {
        memberships: {
          where: { membershipStatus: MembershipStatus.ACTIVE },
          include: { company: true },
        },
      },
    });

    if (!user || user.accountStatus !== 'ACTIVE') {
      const response = NextResponse.json(
        { success: false, error: 'User account disabled or not found.' },
        { status: 401 }
      );
      clearAuthCookies(response);
      return response;
    }

    const primaryMembership = user.memberships[0];

    const newAccessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      globalRole: user.globalRole,
      activeCompanyId: primaryMembership?.companyId || null,
      companyRole: primaryMembership?.role || null,
      companySlug: primaryMembership?.company.slug || null,
      designation: primaryMembership?.designation || null,
      department: primaryMembership?.department || null,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Token rotated successfully.',
      accessToken: newAccessToken,
    });

    setAuthCookies(response, newAccessToken, rotationResult.newRawToken);

    return response;
  } catch (error: any) {
    console.error('[API Refresh Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error refreshing session.' },
      { status: 500 }
    );
  }
}
