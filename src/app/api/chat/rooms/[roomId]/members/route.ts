import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Strict Security: Verify user is a member of this chat room
    const { data: currentMember } = await adminClient
      .from('chat_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!currentMember) {
      return NextResponse.json(
        { error: 'Forbidden: You are not authorized to view members of this room.' },
        { status: 403 }
      );
    }

    // 3. Query all members of this room with their profiles
    const { data: members, error } = await adminClient
      .from('chat_members')
      .select(`
        id,
        room_id,
        user_id,
        joined_at,
        profiles (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('room_id', roomId);

    if (error) {
      console.error('Fetch room members error:', error);
      throw error;
    }

    const formattedMembers = (members || []).map((m: any) => ({
      id: m.id,
      userId: m.user_id,
      joinedAt: m.joined_at,
      name: m.profiles?.full_name || m.profiles?.email || 'Team Member',
      email: m.profiles?.email,
      avatarUrl: m.profiles?.avatar_url,
    }));

    return NextResponse.json({
      success: true,
      members: formattedMembers,
      count: formattedMembers.length,
    });
  } catch (err: any) {
    console.error('GET /api/chat/rooms/[roomId]/members error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
