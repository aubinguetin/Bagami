import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Check if a user has already reviewed a delivery
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deliveryId = searchParams.get('deliveryId');
    const reviewerId = searchParams.get('reviewerId');
    const reviewerContact = searchParams.get('reviewerContact');

    // Validate required parameters
    if (!deliveryId) {
      return NextResponse.json(
        { error: 'deliveryId is required' },
        { status: 400 }
      );
    }

    if (!reviewerId && !reviewerContact) {
      return NextResponse.json(
        { error: 'reviewerId or reviewerContact is required' },
        { status: 400 }
      );
    }

    // Find the reviewer
    let reviewer = null;
    
    if (reviewerId) {
      reviewer = await prisma.user.findUnique({
        where: { id: reviewerId },
        select: { id: true }
      });
    } else if (reviewerContact) {
      const decodedContact = decodeURIComponent(reviewerContact);
      
      // Try to find by email or phone
      reviewer = await prisma.user.findFirst({
        where: {
          OR: [
            { email: decodedContact },
            { phone: decodedContact }
          ]
        },
        select: { id: true }
      });

      // If not found and looks like a phone number, try separated format
      if (!reviewer && decodedContact.startsWith('+')) {
        try {
          const result = await prisma.$queryRaw`
            SELECT id FROM User 
            WHERE countryCode IS NOT NULL AND phone IS NOT NULL 
            AND CONCAT(countryCode, phone) = ${decodedContact}
            LIMIT 1
          ` as any[];
          
          if (result && result.length > 0) {
            reviewer = { id: result[0].id };
          }
        } catch (error) {
          console.error('Error in separated phone query:', error);
        }
      }
    }

    if (!reviewer) {
      return NextResponse.json(
        { hasReviewed: false, message: 'Reviewer not found' },
        { status: 200 }
      );
    }

    // Check if a review exists for this delivery by this reviewer
    const existingReview = await prisma.review.findFirst({
      where: {
        deliveryId: deliveryId,
        reviewerId: reviewer.id
      },
      select: {
        id: true,
        rating: true,
        createdAt: true
      }
    });

    if (existingReview) {
      return NextResponse.json({
        hasReviewed: true,
        review: {
          id: existingReview.id,
          rating: existingReview.rating,
          createdAt: existingReview.createdAt
        }
      });
    }

    return NextResponse.json({
      hasReviewed: false
    });

  } catch (error: any) {
    console.error('Error checking review status:', error);
    return NextResponse.json(
      { error: 'Failed to check review status', details: error.message },
      { status: 500 }
    );
  }
}
