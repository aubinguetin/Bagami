import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contact } = body;

    if (!contact) {
      return NextResponse.json(
        { success: false, message: 'Contact information required' },
        { status: 400 }
      );
    }

    const isEmail = contact.includes('@');
    console.log(`🔍 Checking availability for ${isEmail ? 'email' : 'phone'}:`, contact);

    // Check if contact is already in use
    const existingUser = await prisma.user.findFirst({
      where: isEmail 
        ? { email: contact }
        : { phone: contact }
    });

    const isAvailable = !existingUser;

    return NextResponse.json({
      success: true,
      available: isAvailable,
      contact: contact,
      type: isEmail ? 'email' : 'phone',
      message: isAvailable 
        ? `${isEmail ? 'Email' : 'Phone number'} is available for registration` 
        : `${isEmail ? 'Email' : 'Phone number'} is already in use`,
      existingUserId: existingUser?.id || null
    });

  } catch (error) {
    console.error('Check availability API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}