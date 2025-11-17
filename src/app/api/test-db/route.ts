import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection and data
    const userCount = await prisma.user.count();
    const deliveryCount = await prisma.delivery.count();
    const messageCount = await prisma.message.count();
    const conversationCount = await prisma.conversation.count();
    
    // Get a sample user
    const sampleUser = await prisma.user.findFirst({
      where: { email: 'internegocebusiness@yahoo.com' },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        countryCode: true,
        emailVerified: true,
        phoneVerified: true,
      }
    });

    // Get some sample conversations if they exist
    let sampleConversations: any[] = [];
    if (sampleUser) {
      sampleConversations = await prisma.conversation.findMany({
        where: {
          OR: [
            { participant1Id: sampleUser.id },
            { participant2Id: sampleUser.id }
          ]
        },
        take: 5,
        include: {
          participant1: { select: { id: true, email: true, name: true } },
          participant2: { select: { id: true, email: true, name: true } },
          delivery: { select: { id: true, title: true, status: true } }
        }
      });
    }

    return NextResponse.json({
      success: true,
      databasePath: 'file:./prisma/dev.db (local)',
      stats: {
        users: userCount,
        deliveries: deliveryCount,
        messages: messageCount,
        conversations: conversationCount
      },
      sampleUser,
      sampleConversationsCount: sampleConversations.length,
      sampleConversations: sampleConversations.map((c: any) => ({
        id: c.id,
        participant1: c.participant1.email || 'no-email',
        participant2: c.participant2.email || 'no-email',
        delivery: c.delivery?.title || 'no-delivery'
      }))
    });
  } catch (error: any) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
