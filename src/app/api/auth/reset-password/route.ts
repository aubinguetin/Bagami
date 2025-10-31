import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, phoneNumber, newPassword } = body;
    
    // Support both 'identifier' and 'phoneNumber' for backward compatibility
    const contact = identifier || phoneNumber;

    // Validate request
    if (!contact || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Contact information and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        { success: false, message: 'Password must contain at least one uppercase letter, lowercase letter, number, and special character' },
        { status: 400 }
      );
    }

    try {
      console.log('🔐 Resetting password for user:', contact);
      
      // Find user by phone number or email
      const user = await prisma.user.findFirst({
        where: { 
          OR: [
            { phone: contact },
            { email: contact }
          ]
        }
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found with this contact information' },
          { status: 404 }
        );
      }

      // Check if user's contact method is verified
      const isEmail = contact.includes('@');
      const isVerified = isEmail ? user.emailVerified : user.phoneVerified;
      
      if (!isVerified) {
        const contactType = isEmail ? 'email' : 'phone number';
        return NextResponse.json(
          { success: false, message: `${contactType.charAt(0).toUpperCase() + contactType.slice(1)} is not verified` },
          { status: 400 }
        );
      }

      // Hash the new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update user's password
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          password: hashedPassword,
          updatedAt: new Date()
        } as any
      });

      console.log('✅ Password updated successfully for user:', user.id);

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully'
      });

    } catch (dbError) {
      console.error('🚨 Database error during password reset:', dbError);
      return NextResponse.json(
        { success: false, message: 'Database error occurred' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Reset Password API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}