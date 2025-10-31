# Review System Setup Guide

## Overview
The review system has been implemented with a complete UI and API, currently using mock data. To enable real database storage for reviews, follow these migration steps.

## Current Status
✅ **Completed:**
- Rating Modal component with star rating and comments
- Reviews API with POST and GET endpoints
- Integration with chat for rating after delivery confirmation
- Reviews page displaying user ratings and statistics
- Prisma schema with Review model defined

⏳ **Pending:**
- Database migration to create Review table
- Enabling real database queries (code is ready, just commented out)

## Database Migration Steps

### 1. Create Migration
Run the following command to create a new migration for the Review model:

```bash
npx prisma migrate dev --name add_review_model
```

This will:
- Create the `Review` table in your database
- Add the necessary foreign key relationships
- Create indexes for optimal query performance

### 2. Generate Prisma Client
After migration, regenerate the Prisma client:

```bash
npx prisma generate
```

### 3. Enable Real Database Queries

#### In `/src/app/api/reviews/route.ts`:

**POST endpoint (line 49-68):** Uncomment the real database code and remove the mock response:
```typescript
// UNCOMMENT THIS:
const review = await prisma.review.create({
  data: {
    rating,
    comment: comment || null,
    reviewerId: currentReviewerId,
    revieweeId,
    deliveryId
  },
  include: {
    reviewer: {
      select: {
        id: true,
        name: true,
        email: true
      }
    },
    reviewee: {
      select: {
        id: true,
        name: true
      }
    }
  }
});

return NextResponse.json({
  success: true,
  review
});

// REMOVE THIS:
// Mock response section (lines 70-95)
```

**GET endpoint (line 139-186):** Uncomment the real database query and remove mock data:
```typescript
// UNCOMMENT THIS:
const whereClause: any = {
  revieweeId: currentUserId
};

if (ratingFilter) {
  whereClause.rating = parseInt(ratingFilter);
}

const reviews = await prisma.review.findMany({
  where: whereClause,
  include: {
    reviewer: {
      select: {
        id: true,
        name: true,
        image: true
      }
    },
    delivery: {
      select: {
        id: true,
        title: true,
        type: true
      }
    }
  },
  orderBy: {
    createdAt: 'desc'
  }
});

// Calculate stats from real data
const totalReviews = reviews.length;
const averageRating = totalReviews > 0
  ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
  : 0;

const ratingDistribution = {
  5: reviews.filter(r => r.rating === 5).length,
  4: reviews.filter(r => r.rating === 4).length,
  3: reviews.filter(r => r.rating === 3).length,
  2: reviews.filter(r => r.rating === 2).length,
  1: reviews.filter(r => r.rating === 1).length,
};

return NextResponse.json({
  reviews,
  stats: {
    totalReviews,
    averageRating,
    ratingDistribution
  }
});

// REMOVE THIS:
// Mock data section (lines 188-260)
```

### 4. Restart Development Server
After making the changes, restart your dev server:

```bash
npm run dev
```

## Review Model Schema

The Review model has been added to `prisma/schema.prisma`:

```prisma
model Review {
  id         String   @id @default(cuid())
  rating     Int      // 1-5 stars
  comment    String?
  reviewerId String
  revieweeId String
  deliveryId String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  reviewer   User     @relation("ReviewsGiven", fields: [reviewerId], references: [id], onDelete: Cascade)
  reviewee   User     @relation("ReviewsReceived", fields: [revieweeId], references: [id], onDelete: Cascade)
  delivery   Delivery @relation(fields: [deliveryId], references: [id], onDelete: Cascade)

  @@index([revieweeId])
  @@index([reviewerId])
  @@index([deliveryId])
  @@unique([deliveryId, reviewerId])
}
```

**Key Features:**
- One review per delivery per reviewer (unique constraint)
- Cascading deletes if user or delivery is deleted
- Indexed for fast queries
- Optional comment field
- Timestamps for creation and updates

## Features

### Rating Modal
Location: `/src/components/RatingModal.tsx`

**Features:**
- Interactive 5-star rating system
- Optional comment field (500 characters max)
- Form validation
- Loading states
- Success/error handling

### Reviews API
Location: `/src/app/api/reviews/route.ts`

**POST /api/reviews**
- Creates a new review
- Validates rating (1-5)
- Prevents duplicate reviews per delivery
- Returns created review with reviewer info

**GET /api/reviews**
- Fetches all reviews for a user
- Optional rating filter
- Calculates statistics (average, distribution)
- Ordered by most recent

### Reviews Page
Location: `/src/app/reviews/page.tsx`

**Features:**
- Overview card with average rating
- Rating distribution bars
- Achievement badges (total reviews, avg rating, 5-star count)
- Filter by star rating
- Review cards with reviewer info and comments
- Loading and empty states

### Chat Integration
Location: `/src/app/chat/[conversationId]/page.tsx`

**Features:**
- Rate button appears after delivery confirmation
- Opens rating modal with delivery context
- Automatically refreshes conversation after rating
- Passes delivery ID and reviewee information

## Testing the Feature

### Before Migration (Current State)
1. Complete a delivery transaction in chat
2. Click the "Rate User" button
3. Submit a rating with comment
4. See success message (data is logged but not stored)
5. View reviews page (shows mock data)

### After Migration
1. Complete a delivery transaction in chat
2. Click the "Rate User" button
3. Submit a rating with comment
4. Rating is stored in database
5. View reviews page to see actual ratings
6. Filter reviews by star rating
7. See accurate statistics

## API Response Format

### POST Response
```json
{
  "success": true,
  "review": {
    "id": "clxxx...",
    "rating": 5,
    "comment": "Great service!",
    "reviewerId": "user123",
    "revieweeId": "user456",
    "deliveryId": "delivery789",
    "createdAt": "2025-10-27T...",
    "reviewer": {
      "id": "user123",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### GET Response
```json
{
  "reviews": [...],
  "stats": {
    "totalReviews": 15,
    "averageRating": 4.6,
    "ratingDistribution": {
      "5": 10,
      "4": 3,
      "3": 2,
      "2": 0,
      "1": 0
    }
  }
}
```

## Files Modified

1. ✅ `/src/components/RatingModal.tsx` - New component
2. ✅ `/src/app/api/reviews/route.ts` - API endpoints
3. ✅ `/src/app/reviews/page.tsx` - Reviews display page
4. ✅ `/src/app/chat/[conversationId]/page.tsx` - Chat integration
5. ✅ `/prisma/schema.prisma` - Database schema
6. ✅ `/src/app/profile/page.tsx` - Navigation to reviews

## Future Enhancements

- [ ] Allow users to edit their reviews
- [ ] Add image uploads to reviews
- [ ] Implement review responses/replies
- [ ] Add review moderation system
- [ ] Send notifications when reviewed
- [ ] Display average rating on user profiles
- [ ] Add review metrics to delivery cards
- [ ] Implement review verification (verified purchase)
- [ ] Add helpful/not helpful voting on reviews
- [ ] Generate review analytics dashboard

## Notes

- Users can only leave one review per delivery
- Reviews are permanently linked to deliveries
- Deleting a user or delivery cascades to delete their reviews
- Rating must be between 1-5 stars
- Comments are optional but recommended
- All reviews are public and visible on user profiles
