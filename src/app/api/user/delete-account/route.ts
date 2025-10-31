import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, confirmation } = body;

    // Validate request
    if (!userId || !confirmation) {
      return NextResponse.json(
        { success: false, message: 'User ID and confirmation are required' },
        { status: 400 }
      );
    }

    // Verify confirmation text
    if (confirmation !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { success: false, message: 'Invalid confirmation text' },
        { status: 400 }
      );
    }

    console.log('🗑️ Starting account deletion for user:', userId);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sentDeliveries: true,
        receivedDeliveries: true,
        accounts: true,
        sessions: true,
      }
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Store user info for verification after deletion
    const userEmail = existingUser.email;
    const userPhone = existingUser.phone;

    // Begin transaction to delete all user data
    await prisma.$transaction(async (tx) => {
      console.log('🧹 Cleaning up user data...');

      // Delete user's deliveries (both sent and received)
      const deletedDeliveries = await tx.delivery.deleteMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      });
      console.log(`📦 Deleted ${deletedDeliveries.count} deliveries`);

      // Delete user's sessions
      const deletedSessions = await tx.session.deleteMany({
        where: { userId: userId }
      });
      console.log(`🔐 Deleted ${deletedSessions.count} sessions`);

      // Delete user's accounts (OAuth connections)
      const deletedAccounts = await tx.account.deleteMany({
        where: { userId: userId }
      });
      console.log(`🔗 Deleted ${deletedAccounts.count} OAuth accounts`);

      // Finally, delete the user
      await tx.user.delete({
        where: { id: userId }
      });
      console.log('👤 User record deleted');

      console.log('✅ User and all associated data deleted successfully');
    });

    // Verify the user is actually deleted
    const verifyDeletion = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (verifyDeletion) {
      console.error('🚨 User still exists after deletion attempt!');
      throw new Error('Failed to delete user completely');
    }

    // Verify email/phone are available for reuse
    if (userEmail) {
      const emailCheck = await prisma.user.findUnique({
        where: { email: userEmail }
      });
      if (emailCheck) {
        console.error('🚨 Email still in use after deletion!');
        throw new Error('Failed to free up email address');
      }
      console.log('📧 Email freed for reuse:', userEmail);
    }

    if (userPhone) {
      const phoneCheck = await prisma.user.findUnique({
        where: { phone: userPhone }
      });
      if (phoneCheck) {
        console.error('🚨 Phone still in use after deletion!');
        throw new Error('Failed to free up phone number');
      }
      console.log('📱 Phone freed for reuse:', userPhone);
    }

    // Small delay to ensure database consistency
    await new Promise(resolve => setTimeout(resolve, 100));

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
      freedResources: {
        email: userEmail || null,
        phone: userPhone || null
      }
    });

  } catch (error) {
    console.error('🚨 Delete account API error:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { success: false, message: 'User account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error occurred while deleting account' },
      { status: 500 }
    );
  }
}