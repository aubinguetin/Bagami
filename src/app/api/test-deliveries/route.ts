import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('🧪 Testing deliveries endpoint...');
    
    const count = await prisma.delivery.count();
    console.log('📊 Total deliveries in DB:', count);
    
    const deliveries = await prisma.delivery.findMany({
      take: 5,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log('📦 Sample deliveries:', deliveries.length);
    
    return NextResponse.json({
      success: true,
      count,
      deliveries: deliveries.map(d => ({
        id: d.id,
        title: d.title,
        senderId: d.senderId,
        senderName: d.sender?.name,
        createdAt: d.createdAt
      }))
    });
    
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    return NextResponse.json({ 
      error: 'Database error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}