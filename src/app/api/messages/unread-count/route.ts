import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get unread message count for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const url = new URL(request.url);
    const currentUserId = url.searchParams.get('currentUserId');
    const currentUserContact = url.searchParams.get('currentUserContact');
    
    let currentUser = null;

    // Try NextAuth session first
    if (session?.user?.email) {
      currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
    }
    
    // Fallback to direct user lookup if no session or user not found
    if (!currentUser) {
      if (currentUserId) {
        currentUser = await prisma.user.findUnique({
          where: { id: currentUserId }
        });
      } else if (currentUserContact) {
        // Decode the URL-encoded contact info
        const decodedContact = decodeURIComponent(currentUserContact);
        
        currentUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: decodedContact },
              { phone: decodedContact }
            ]
          }
        });
      }
    }

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized - User not found' }, { status: 401 });
    }

    // Count unread messages where the current user is NOT the sender
    const unreadCount = await prisma.message.count({
      where: {
        isRead: false,
        senderId: { not: currentUser.id },
        conversation: {
          OR: [
            { participant1Id: currentUser.id },
            { participant2Id: currentUser.id }
          ]
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      unreadCount 
    });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}