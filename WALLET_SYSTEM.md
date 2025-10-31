# Wallet System Implementation Guide

## Overview
The wallet system has been successfully integrated into the Bagami delivery platform. Users now have digital wallets where they can receive payments and pay for deliveries.

## Database Schema

### Wallet Model
```prisma
model Wallet {
  id        String   @id @default(cuid())
  userId    String   @unique
  balance   Float    @default(0)
  currency  String   @default("XAF")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Transaction Model
```prisma
model Transaction {
  id          String   @id @default(cuid())
  userId      String
  type        String // credit or debit
  amount      Float
  currency    String   @default("XAF")
  status      String   @default("completed") // completed, pending, failed
  description String
  category    String // Delivery Payment, Withdrawal, Fee, Bonus, etc.
  referenceId String?
  metadata    String? // JSON string for additional data
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## Services

### Wallet Service (`src/services/walletService.ts`)

Key functions:
- `getOrCreateWallet(userId)` - Get or create a wallet for a user
- `createTransaction(data)` - Create a transaction and update wallet balance
- `creditWallet(userId, amount, description, category, referenceId, metadata)` - Add money to wallet
- `debitWallet(userId, amount, description, category, referenceId, metadata)` - Subtract money from wallet
- `getWalletBalance(userId)` - Get current balance
- `getUserTransactions(userId, options)` - Get transaction history
- `getWalletStats(userId)` - Get wallet statistics (balance, total credit, total debit, pending)

## API Endpoints

### 1. Get Wallet Data
**Endpoint:** `GET /api/wallet`

**Query Parameters:**
- `userId` - User ID
- `userContact` - User email or phone
- `type` - Filter by transaction type (credit/debit)
- `status` - Filter by status
- `limit` - Number of transactions to return

**Response:**
```json
{
  "stats": {
    "balance": 245000,
    "currency": "XAF",
    "totalCredit": 890000,
    "totalDebit": 645000,
    "pendingAmount": 50000
  },
  "transactions": [
    {
      "id": "...",
      "type": "credit",
      "amount": 45000,
      "currency": "XAF",
      "status": "completed",
      "description": "Payment received for delivery to Douala",
      "category": "Delivery Payment",
      "date": "2025-10-26T14:30:00Z",
      "referenceId": "DEL-2025-001234"
    }
  ]
}
```

### 2. Process Delivery Payment (DEPRECATED - Use Credit/Debit Instead)
**Endpoint:** `POST /api/deliveries/payment`

**Note:** This endpoint is now deprecated. Use the individual credit/debit endpoints for better control.

**Request Body:**
```json
{
  "deliveryId": "...",
  "senderId": "...",
  "receiverId": "...",
  "amount": 50000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "amount": 50000,
  "recipientAmount": 47500,
  "serviceFee": 2500
}
```

**How it works:**
1. Identifies payer and recipient based on delivery type:
   - **Request**: Sender (requester) pays Receiver (traveler)
   - **Offer**: Receiver (customer) pays Sender (traveler)
2. Calculates 5% service fee
3. Debits payer's wallet
4. Credits recipient's wallet (minus service fee)

### 3. Debit Wallet (NEW ✅)
**Endpoint:** `POST /api/wallet/debit`

**Request Body:**
```json
{
  "userId": "user123",
  "amount": 50000,
  "description": "Payment for delivery: Package from Yaoundé to Douala",
  "category": "Delivery Payment",
  "referenceId": "DELIVERY-abc123",
  "metadata": {
    "deliveryId": "abc123",
    "deliveryType": "request",
    "fromCity": "Yaoundé",
    "toCity": "Douala"
  }
}
```

**Response:**
```json
{
  "success": true,
  "wallet": {
    "id": "wallet123",
    "userId": "user123",
    "balance": 250000,
    "currency": "XAF"
  },
  "transaction": {
    "id": "txn123",
    "type": "debit",
    "amount": 50000,
    "status": "completed",
    "description": "Payment for delivery: Package from Yaoundé to Douala",
    "category": "Delivery Payment",
    "referenceId": "DELIVERY-abc123"
  }
}
```

**Error Response (Insufficient Balance):**
```json
{
  "error": "Insufficient balance in wallet"
}
```

### 4. Credit Wallet (NEW ✅)
**Endpoint:** `POST /api/wallet/credit`

**Request Body:**
```json
{
  "userId": "user456",
  "amount": 50000,
  "description": "Payment received for delivery: Package from Yaoundé to Douala",
  "category": "Delivery Income",
  "referenceId": "DELIVERY-CONFIRM-abc123",
  "metadata": {
    "deliveryId": "abc123",
    "paidBy": "John Doe",
    "paidById": "user123",
    "originalTransactionId": "txn123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "wallet": {
    "id": "wallet456",
    "userId": "user456",
    "balance": 350000,
    "currency": "XAF"
  },
  "transaction": {
    "id": "txn456",
    "type": "credit",
    "amount": 50000,
    "status": "completed",
    "description": "Payment received for delivery: Package from Yaoundé to Douala",
    "category": "Delivery Income",
    "referenceId": "DELIVERY-CONFIRM-abc123"
  }
}
```

### 5. Initialize Wallets
**Endpoint:** `POST /api/wallet/init`

Creates wallets for all existing users who don't have one yet.

## Payment Flow

### Scenario 1: Delivery Request
1. User A creates a delivery request (needs package delivered)
2. User B (traveler) accepts the request
3. They agree on price in chat
4. When delivery is confirmed:
   ```typescript
   await fetch('/api/deliveries/payment', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       deliveryId: delivery.id,
       senderId: delivery.senderId, // User A (requester)
       receiverId: delivery.receiverId, // User B (traveler)
       amount: delivery.price
     })
   });
   ```
5. System:
   - Debits User A's wallet
   - Credits User B's wallet (minus 5% fee)
   - Records both transactions

### Scenario 2: Travel Offer
1. User A creates a travel offer (traveling and can carry items)
2. User B requests to send a package
3. They agree on price in chat
4. When delivery is confirmed:
   ```typescript
   await fetch('/api/deliveries/payment', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       deliveryId: delivery.id,
       senderId: delivery.senderId, // User A (traveler)
       receiverId: delivery.receiverId, // User B (customer)
       amount: delivery.price
     })
   });
   ```
5. System:
   - Debits User B's wallet (customer)
   - Credits User A's wallet (traveler, minus 5% fee)
   - Records both transactions

## Integration Points

### Payment Flow (IMPLEMENTED ✅)

The wallet system is now fully integrated into the delivery payment flow:

1. **When User Makes Payment:**
   - Location: `src/app/chat/[conversationId]/page.tsx` - `handleConfirmPayment()`
   - API: `POST /api/wallet/debit`
   - Action: Amount is deducted from payer's wallet
   - Transaction: Created with category "Delivery Payment"
   - User receives confirmation with new balance

2. **When Delivery is Confirmed:**
   - Location: `src/app/chat/[conversationId]/page.tsx` - `handleConfirmDelivery()`
   - API: `POST /api/wallet/credit`
   - Action: Amount is credited to recipient's wallet
   - Transaction: Created with category "Delivery Income"
   - User receives confirmation with new balance

### Payment Process

**Step 1: Payment Initiation**
```typescript
// When user clicks "Pay" button
const handleConfirmPayment = async () => {
  // Debit wallet
  const response = await fetch('/api/wallet/debit', {
    method: 'POST',
    body: JSON.stringify({
      userId: session.user.id,
      amount: agreedPrice.price,
      description: `Payment for delivery: ${deliveryTitle}`,
      category: 'Delivery Payment',
      referenceId: `DELIVERY-${deliveryId}`
    })
  });
  
  // Generate delivery code & send payment message
}
```

**Step 2: Delivery Confirmation**
```typescript
// When recipient confirms delivery
const handleConfirmDelivery = async () => {
  // Credit wallet
  const response = await fetch('/api/wallet/credit', {
    method: 'POST',
    body: JSON.stringify({
      userId: session.user.id,
      amount: paymentData.amount,
      description: `Payment received for delivery: ${deliveryTitle}`,
      category: 'Delivery Income',
      referenceId: `DELIVERY-CONFIRM-${deliveryId}`
    })
  });
  
  // Send confirmation message
}
```

### Where to Add Payment Processing (OLD - DEPRECATED)

1. **After Delivery Confirmation**
   - When a delivery confirmation message/card is sent
   - Hook: Look for messages with type `deliveryConfirmation`
   - Call `/api/deliveries/payment` endpoint

2. **Example Integration in Chat:**
   ```typescript
   const handleDeliveryConfirmation = async () => {
     // First, send the confirmation message
     await sendMessage({
       type: 'deliveryConfirmation',
       content: JSON.stringify({ deliveryId, confirmedAt: new Date() })
     });

     // Then, process the payment
     if (delivery.price && delivery.price > 0) {
       try {
         const response = await fetch('/api/deliveries/payment', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             deliveryId: delivery.id,
             senderId: delivery.senderId,
             receiverId: delivery.receiverId,
             amount: delivery.price
           })
         });
         
         const result = await response.json();
         if (result.success) {
           // Show success notification
           console.log('Payment processed:', result);
         }
       } catch (error) {
         console.error('Payment failed:', error);
         // Handle error - maybe show notification to retry
       }
     }
   };
   ```

## Transaction Categories

- **Delivery Payment** - Payment for completed delivery
- **Withdrawal** - User withdraws money to Mobile Money/Bank
- **Fee** - Platform service fees
- **Bonus** - Rewards for good ratings, promotions
- **Refund** - Money returned to user
- **Top-up** - User adds money to wallet

## Security Considerations

1. **Balance Check**: System checks if user has sufficient balance before debit
2. **Atomic Transactions**: Uses Prisma transactions to ensure wallet updates and transaction records are consistent
3. **Status Tracking**: Transactions have status (completed, pending, failed) for reconciliation
4. **Metadata**: Additional data stored as JSON for audit trail

## UI Features

### Wallet Page (`/wallet`)
- Shows current balance with hide/show toggle
- Displays Credit and Debit totals
- Transaction history with filters (All/Income/Expenses)
- Payment method management
- Mobile-optimized design

### Features:
- Real-time balance updates
- Transaction filtering
- Status indicators (completed, pending, failed)
- Reference IDs for tracking
- Category labels for easy identification

## Testing

1. **Initialize wallets for existing users:**
   ```bash
   curl -X POST http://localhost:3002/api/wallet/init
   ```

2. **Check a user's wallet:**
   ```bash
   curl "http://localhost:3002/api/wallet?userId=USER_ID"
   ```

3. **Test payment processing:**
   ```bash
   curl -X POST http://localhost:3002/api/deliveries/payment \
     -H "Content-Type: application/json" \
     -d '{
       "deliveryId": "...",
       "senderId": "...",
       "receiverId": "...",
       "amount": 50000
     }'
   ```

## Next Steps

1. **Add Payment Trigger**: Integrate payment processing when delivery confirmation happens in chat
2. **Add Withdrawal Feature**: Allow users to withdraw money to Mobile Money/Bank
3. **Add Top-up Feature**: Allow users to add money to wallet
4. **Add Notifications**: Notify users when they receive or spend money
5. **Add Transaction Details**: View detailed transaction information
6. **Add Platform Wallet**: Track platform fees and revenue

## Notes

- All amounts are in XAF (Central African CFA franc)
- Service fee is currently set to 5%
- Wallets are automatically created when needed
- Transaction history is unlimited but can be paginated
- Failed transactions don't affect wallet balance
