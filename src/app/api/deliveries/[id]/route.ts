import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT - Edit delivery
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const deliveryId = params.id;
    const body = await request.json();
    
    const { 
      fromCountry, 
      fromCity, 
      toCountry, 
      toCity, 
      title,
      description, 
      departureDate,
      arrivalDate,
      weight,
      price,
      // Support fallback auth
      currentUserId: fallbackUserId,
      currentUserContact: fallbackUserContact
    } = body;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing delivery
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId }
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    // Check if current user owns this delivery
    let currentUserId: string | undefined = session?.user?.id;
    if (!currentUserId && session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      currentUserId = user?.id;
    }

    if (!currentUserId || delivery.senderId !== currentUserId) {
      return NextResponse.json({ error: 'Forbidden: You can only update your own deliveries' }, { status: 403 });
    }

    // Update delivery
    const updatedDelivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        fromCountry,
        fromCity,
        toCountry,
        toCity,
        title,
        description,
        departureDate: new Date(departureDate),
        weight: weight ? parseFloat(weight) : undefined,
        price: price ? parseFloat(price) : undefined,
      }
    });

    return NextResponse.json({ 
      message: 'Delivery updated successfully', 
      delivery: updatedDelivery 
    });

  } catch (error) {
    console.error('Error updating delivery:', error);
    return NextResponse.json(
      { error: 'Failed to update delivery' },
      { status: 500 }
    );
  }
}

// DELETE - Remove delivery
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json().catch(() => ({}));
    const { currentUserId: fallbackUserId, currentUserContact: fallbackUserContact } = body;

    const deliveryId = params.id;

    // Get existing delivery
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId }
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    // Check if current user owns this delivery - support both NextAuth and fallback auth
    let currentUserId: string | undefined;
    
    if (session?.user?.id) {
      currentUserId = session.user.id;
    } else if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      currentUserId = user?.id;
    } else if (fallbackUserId) {
      currentUserId = fallbackUserId;
    } else if (fallbackUserContact) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: fallbackUserContact },
            { phone: fallbackUserContact }
          ]
        }
      });
      currentUserId = user?.id;
    }

    if (!currentUserId || delivery.senderId !== currentUserId) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own deliveries' }, { status: 403 });
    }

    // Delete delivery
    await prisma.delivery.delete({
      where: { id: deliveryId }
    });

    return NextResponse.json({ 
      message: 'Delivery deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting delivery:', error);
    return NextResponse.json(
      { error: 'Failed to delete delivery' },
      { status: 500 }
    );
  }
}

// PATCH - Activate/Deactivate delivery
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deliveryId = params.id;
    const body = await request.json();
    const { status } = body;

    if (!status || !['PENDING', 'INACTIVE'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be PENDING or INACTIVE' }, { status: 400 });
    }

    // Get existing delivery
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId }
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    // Check if current user owns this delivery
    let currentUserId: string | undefined = session.user?.id;
    if (!currentUserId && session.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      currentUserId = user?.id;
    }

    if (!currentUserId || delivery.senderId !== currentUserId) {
      return NextResponse.json({ error: 'Forbidden: You can only update your own deliveries' }, { status: 403 });
    }

    // Update delivery status
    const updatedDelivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: { status }
    });

    return NextResponse.json({ 
      message: `Delivery ${status.toLowerCase()} successfully`, 
      delivery: updatedDelivery 
    });

  } catch (error) {
    console.error('Error updating delivery status:', error);
    return NextResponse.json(
      { error: 'Failed to update delivery status' },
      { status: 500 }
    );
  }
}