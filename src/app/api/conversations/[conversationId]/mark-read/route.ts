import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH - Mark all messages in a conversation as read for the current user
export async function PATCH(request: NextRequest, { params }: { params: { conversationId: string } }) {
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

        // If not found and it looks like a phone number, try separated format
        if (!currentUser && decodedContact.startsWith('+')) {
          try {
            const result = await prisma.$queryRaw`
              SELECT * FROM User 
              WHERE countryCode IS NOT NULL AND phone IS NOT NULL 
              AND CONCAT(countryCode, phone) = ${decodedContact}
            ` as any[];
            
            if (result && result.length > 0) {
              currentUser = result[0];
            }
          } catch (rawQueryError) {
            console.error('Raw query error:', rawQueryError);
          }
        }
      }
    }

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized - User not found' }, { status: 401 });
    }

    // Verify the conversation exists and the user is a participant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: params.conversationId,
        OR: [
          { participant1Id: currentUser.id },
          { participant2Id: currentUser.id }
        ]
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or unauthorized' }, { status: 404 });
    }

    // Mark all unread messages in this conversation as read for the current user
    // Only mark messages where the current user is NOT the sender
    const updateResult = await prisma.message.updateMany({
      where: {
        conversationId: params.conversationId,
        isRead: false,
        senderId: { not: currentUser.id }
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    console.log(`✅ Marked ${updateResult.count} messages as read for user ${currentUser.id} in conversation ${params.conversationId}`);

    // Update unread count for the current user if messages were marked as read
    if (updateResult.count > 0) {
      try {
        // Get updated unread count for the current user
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

        // Broadcast unread count update to current user
        const { broadcastUnreadCountToUser } = await import('@/lib/sse');
        await broadcastUnreadCountToUser(currentUser.id, unreadCount);
        console.log(`🔢 Unread count update sent to user ${currentUser.id}: ${unreadCount} unread messages`);
      } catch (unreadError) {
        console.error('Error updating unread count via SSE:', unreadError);
        // Don't fail the API call if unread count update fails
      }
    }

    return NextResponse.json({ 
      success: true,
      markedCount: updateResult.count,
      message: `Marked ${updateResult.count} messages as read`
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}