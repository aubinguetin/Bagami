import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { conversationId } = params;

    // Fetch conversation with delivery and participants
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { participant1Id: session.user.id },
          { participant2Id: session.user.id }
        ]
      },
      include: {
        delivery: true,
        participant1: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        participant2: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Determine the other participant
    const otherParticipant = conversation.participant1Id === session.user.id
      ? conversation.participant2
      : conversation.participant1;

    return NextResponse.json({
      id: conversation.id,
      delivery: {
        id: conversation.delivery.id,
        title: conversation.delivery.title,
        description: conversation.delivery.description,
        type: conversation.delivery.type,
        fromCountry: conversation.delivery.fromCountry,
        fromCity: conversation.delivery.fromCity,
        toCountry: conversation.delivery.toCountry,
        toCity: conversation.delivery.toCity,
        departureDate: conversation.delivery.departureDate,
        arrivalDate: conversation.delivery.arrivalDate,
        weight: conversation.delivery.weight,
        price: conversation.delivery.price,
        currency: conversation.delivery.currency,
        status: conversation.delivery.status,
        senderId: conversation.delivery.senderId,
        receiverId: conversation.delivery.receiverId
      },
      otherParticipant,
      createdAt: conversation.createdAt,
      lastMessageAt: conversation.lastMessageAt
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}
