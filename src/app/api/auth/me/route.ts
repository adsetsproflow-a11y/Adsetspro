import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthenticatedUser(request);

    if (!authContext) {
      return NextResponse.json(
        { success: false, error: 'Unauthenticated. No valid session found.' },
        { status: 401 }
      );
    }

    // Fetch full user details with all memberships and companies
    const fullUser = await prisma.user.findUnique({
      where: { id: authContext.userId },
      select: {
        id: true,
        name: true,
        email: true,
        globalRole: true,
        accountStatus: true,
        emailVerifiedAt: true,
        avatarUrl: true,
        createdAt: true,
        memberships: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!fullUser) {
      return NextResponse.json(
        { success: false, error: 'User account not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: fullUser.id,
        name: fullUser.name,
        email: fullUser.email,
        globalRole: fullUser.globalRole,
        accountStatus: fullUser.accountStatus,
        emailVerified: !!fullUser.emailVerifiedAt,
        avatarUrl: fullUser.avatarUrl,
        createdAt: fullUser.createdAt,
      },
      activeMembership: authContext.activeMembership,
      memberships: fullUser.memberships.map((m) => ({
        id: m.id,
        role: m.role,
        designation: m.designation,
        department: m.department,
        membershipStatus: m.membershipStatus,
        company: m.company,
      })),
    });
  } catch (error: any) {
    console.error('[API /auth/me Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching session user.' },
      { status: 500 }
    );
  }
}
