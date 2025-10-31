import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    const {
      postType,
      itemType,
      description,
      weight,
      departureCountry,
      departureCity,
      destinationCountry,
      destinationCity,
      departureDate,
      arrivalDate,
      price,
      notes,
      // Accept fallback auth parameters
      currentUserId,
      currentUserContact
    } = body;

    // Validate required fields
    if (!postType || !departureCountry || !departureCity || !destinationCountry || !destinationCity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create the location strings
    const fromLocation = `${departureCity}, ${departureCountry}`;
    const toLocation = `${destinationCity}, ${destinationCountry}`;

    // Debug logging to see what's being sent
    console.log('📦 POST body received:', {
      postType,
      itemType,
      description,
      arrivalDate,
      departureDate,
      currentUserId,
      currentUserContact
    });

    // Additional validation for delivery posts
    if (postType === 'delivery') {
      if (!itemType || !description || !arrivalDate) {
        console.log('❌ Validation failed for delivery:', {
          itemType: !!itemType,
          description: !!description,
          arrivalDate: !!arrivalDate
        });
        return NextResponse.json({ error: 'Missing required delivery fields' }, { status: 400 });
      }
    } else if (postType === 'travel') {
      if (!departureDate) {
        console.log('❌ Validation failed for travel:', {
          departureDate: !!departureDate
        });
        return NextResponse.json({ error: 'Missing required travel fields' }, { status: 400 });
      }
    }

    // Find or get user ID - support both NextAuth session and fallback auth
    let userId: string | undefined;
    
    if (session?.user?.id) {
      userId = session.user.id;
    } else if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      userId = user?.id;
    } else if (currentUserId) {
      // Fallback to localStorage-based auth
      userId = currentUserId;
    } else if (currentUserContact) {
      // Try to find user by contact (email or phone)
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: currentUserContact },
            { phone: currentUserContact }
          ]
        }
      });
      userId = user?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required. Please log in.' }, { status: 401 });
    }

    // Generate title based on post type
    const title = postType === 'delivery' 
      ? `${itemType} delivery` 
      : `Travel offer: ${fromLocation} to ${toLocation}`;

    // Create delivery post in database
    const deliveryData: any = {
      title,
      description: description || "",
      weight: weight ? parseFloat(weight) : null,
      price: price ? parseFloat(price) : null,
      currency: 'XOF', // Default currency
      type: postType === 'delivery' ? 'request' : 'offer',
      fromCountry: departureCountry,
      fromCity: departureCity,
      toCountry: destinationCountry,
      toCity: destinationCity,
      senderId: userId,
    };

    // Handle date fields based on post type
    if (postType === 'delivery') {
      // For delivery requests: use current date as departureDate (when request is made)
      // and arrivalDate as when they need it delivered
      deliveryData.departureDate = new Date(); // Current date when request is posted
      deliveryData.arrivalDate = new Date(arrivalDate);
    } else {
      // For travel offers: use the actual departure date
      deliveryData.departureDate = new Date(departureDate);
      deliveryData.arrivalDate = arrivalDate ? new Date(arrivalDate) : null;
    }

    const delivery = await prisma.delivery.create({
      data: deliveryData,
    });

    console.log('📦 New delivery post created:', delivery.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Delivery post created successfully',
      data: {
        id: delivery.id,
        type: postType,
        fromLocation,
        toLocation,
        createdAt: delivery.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating delivery post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}