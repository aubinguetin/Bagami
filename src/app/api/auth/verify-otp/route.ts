import { NextRequest, NextResponse } from 'next/server';
import { OTPStorage } from '@/services/smsService';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { countryCodes } from '@/data/countryCodes';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, otp, testAccount, fullName, password, countryInfo } = body;

    // Validate request
    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { success: false, message: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    // Handle test account bypass or regular OTP verification
    let result;
    const isTestAccount = testAccount && (
      phoneNumber === '+22677889900' || phoneNumber === '+337783928899'
    ) && otp === 'TEST_BYPASS';
    
    if (isTestAccount) {
      console.log('🧪 Test account detected - bypassing OTP verification for:', phoneNumber);
      
      // Skip OTP verification for test account, proceed directly to user creation/verification
      result = { success: true, message: 'Test account verified successfully.' };
    } else {
      // Regular OTP verification for non-test accounts
      result = OTPStorage.verify(phoneNumber, otp);
    }

    // Check verification result
    if (!result.success) {
      // Handle specific OTP verification errors
      let statusCode = 400;
      let userMessage = result.message;

      if (result.message.includes('expired')) {
        userMessage = 'Verification code has expired. Please request a new one.';
        statusCode = 410;
      } else if (result.message.includes('not found') || result.message.includes('No OTP')) {
        userMessage = 'No verification code found. Please request a new one.';
        statusCode = 404;
      } else if (result.message.includes('Invalid')) {
        userMessage = 'Invalid verification code. Please check and try again.';
        statusCode = 400;
      }

      return NextResponse.json(
        { success: false, error: userMessage, message: userMessage },
        { status: statusCode }
      );
    }

    // Create or update user in database with security checks
    try {
      console.log('💾 Creating/updating user in database for:', phoneNumber);
      
      const isEmail = phoneNumber.includes('@');
      
      // Check for existing user with same contact method
      console.log(`🔍 Checking for existing user with ${isEmail ? 'email' : 'phone'}:`, phoneNumber);
      
      let existingUser = null;
      
      if (isEmail) {
        existingUser = await prisma.user.findFirst({
          where: { email: phoneNumber }
        });
      } else {
        // For phone numbers, try both old and new formats
        // First try: exact match (old format)
        existingUser = await prisma.user.findFirst({
          where: { phone: phoneNumber }
        });
        
        // Second try: separated format (new)
        if (!existingUser && phoneNumber.startsWith('+')) {
          // Use sophisticated parsing like we do in auth
          const sortedCountryCodes = countryCodes
            .slice()
            .sort((a, b) => b.dialCode.length - a.dialCode.length);

          for (const countryData of sortedCountryCodes) {
            if (phoneNumber.startsWith(countryData.dialCode)) {
              const countryCode = countryData.dialCode;
              const localPhone = phoneNumber.slice(countryData.dialCode.length);
              
              console.log('🔍 Checking separated format:', { countryCode, localPhone });
              
              existingUser = await prisma.user.findFirst({
                where: {
                  AND: [
                    { countryCode: countryCode },
                    { phone: localPhone }
                  ]
                }
              });
              
              if (existingUser) {
                console.log('✅ Found user with separated phone format');
                break;
              }
            }
          }
        }
      }
      
      if (existingUser) {
        console.log('👤 Found existing user:', existingUser.id, 'Active:', existingUser.isActive);
      } else {
        console.log('🆕 No existing user found - will create new account');
      }

      let userId;

      if (!existingUser) {
        // Create new user only if none exists with this contact method
        let hashedPassword = null;
        if (password) {
          hashedPassword = await bcrypt.hash(password, 10);
        }

        // Parse phone number to separate country code and local number
        let countryCode = null;
        let localPhone = phoneNumber;
        
        if (!isEmail && phoneNumber.startsWith('+')) {
          // Import countryCodes to get accurate country code matching
          const { countryCodes } = await import('@/data/countryCodes');
          
          // Sort by length (longest first) to avoid partial matches
          const sortedCountryCodes = [...countryCodes].sort((a, b) => b.dialCode.length - a.dialCode.length);
          
          // Find the correct country code match
          for (const country of sortedCountryCodes) {
            if (phoneNumber.startsWith(country.dialCode)) {
              countryCode = country.dialCode;
              localPhone = phoneNumber.substring(country.dialCode.length);
              console.log(`📱 Parsed phone: ${phoneNumber} → Code: ${countryCode}, Local: ${localPhone}`);
              break;
            }
          }
          
          // Fallback if no match found
          if (!countryCode) {
            const match = phoneNumber.match(/^(\+\d{1,4})(.+)$/);
            if (match) {
              countryCode = match[1];
              localPhone = match[2];
              console.log(`📱 Fallback parsing: ${phoneNumber} → Code: ${countryCode}, Local: ${localPhone}`);
            }
          }
        }

        const userData = isEmail 
          ? { 
              email: phoneNumber, 
              emailVerified: new Date(),
              name: fullName || null,
              password: hashedPassword,
              country: countryInfo?.name || null, // Store country name
              isActive: true 
            }
          : { 
              phone: localPhone, // Store only the local part
              countryCode: countryCode, // Store country code separately
              phoneVerified: new Date(),
              name: fullName || null,
              password: hashedPassword,
              country: countryInfo?.name || null, // Store country name
              isActive: true 
            };

        const newUser = await prisma.user.create({
          data: userData
        });
        userId = newUser.id;
        console.log('✅ New user created:', newUser.id);
      } else {
        // Update verification status for existing user
        const updateData: any = isEmail
          ? { emailVerified: new Date() }
          : { phoneVerified: new Date() };

        // If user exists but doesn't have a password, and we have one, add it
        if (password && !(existingUser as any).password) {
          updateData.password = await bcrypt.hash(password, 10);
          console.log('🔐 Adding password to existing user without one');
        }

        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: updateData
        });
        userId = updatedUser.id;
        console.log('✅ Existing user verified:', updatedUser.id);
      }

      // Return user info for authentication
      return NextResponse.json({
        success: true,
        message: result.message,
        user: {
          id: userId,
          contact: phoneNumber,
          verified: true
        }
      });

    } catch (dbError) {
      console.error('🚨 Database error during user creation:', dbError);
      return NextResponse.json(
        { success: false, message: 'Database error occurred' },
        { status: 500 }
      );
    }

    // This code should not be reached due to the return above
    return NextResponse.json({
      success: true,
      message: result.message,
    });

  } catch (error) {
    console.error('Verify OTP API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}