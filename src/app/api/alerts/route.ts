import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      departureCountry,
      destinationCountry,
      alertType,
      keywords,
      emailNotifications
    } = body;

    // Validate required fields
    if (!name || !alertType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find or get user ID
    let userId: string | undefined = session.user?.id;
    if (!userId && session.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      userId = user?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // For now, let's create a simple alert object and log it
    // In a full implementation, you'd want to create an Alert table in your schema
    const alertData = {
      name,
      userId,
      departureCountry: departureCountry || null,
      destinationCountry: destinationCountry || null,
      alertType,
      keywords: keywords || null,
      emailNotifications: emailNotifications || false,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    console.log('🔔 New delivery alert created:', alertData);

    // TODO: In a real implementation, you would:
    // 1. Save the alert to a database table
    // 2. Set up a background job to check for matches
    // 3. Send notifications when matches are found

    return NextResponse.json({ 
      success: true, 
      message: 'Alert created successfully',
      alert: alertData 
    });
    
  } catch (error) {
    console.error('❌ Error creating alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, return empty array
    // In a real implementation, you'd fetch user's alerts from database
    return NextResponse.json({
      success: true,
      alerts: []
    });
    
  } catch (error) {
    console.error('❌ Error fetching alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}