# Platform Fee Implementation

**Date:** October 28, 2025  
**Current Fee Rate:** 17.5%  
**Status:** ✅ FULLY IMPLEMENTED

## Overview

The platform fee system allows Bagami21 to earn revenue from each successful delivery transaction. The fee is **deducted from the traveler's earnings**, not added to the payer's cost.

### How It Works

```
Example Transaction: 100,000 XAF delivery payment

┌─────────────────────────────────────┐
│ PAYER (Sender/Requester)            │
│ Pays: 100,000 XAF                   │
│ Wallet Debited: -100,000 XAF        │
└─────────────────────────────────────┘
                 ↓
        ┌─────────────────┐
        │ BAGAMI21        │
        │ Fee: 17,500 XAF │
        │ (17.5%)         │
        └─────────────────┘
                 ↓
┌─────────────────────────────────────┐
│ TRAVELER (Deliverer)                │
│ Receives: 82,500 XAF                │
│ Wallet Credited: +82,500 XAF        │
└─────────────────────────────────────┘
```

## Configuration

### Fee Rate Settings
**File:** `src/config/platform.ts`

```typescript
export const PLATFORM_CONFIG = {
  FEE_RATE: 0.175,      // 17.5% - Main fee rate
  MIN_FEE: 0,           // Minimum fee (0 = no minimum)
  MAX_FEE: Infinity,    // Maximum fee (Infinity = no maximum)
}
```

### How to Change the Fee Rate

1. Open `src/config/platform.ts`
2. Update `FEE_RATE` value:
   - 0.175 = 17.5%
   - 0.20 = 20%
   - 0.15 = 15%
3. Save the file
4. Restart the server
5. New rate applies to all future transactions

**Example:**
```typescript
// Change from 17.5% to 20%
FEE_RATE: 0.20,  // Changed from 0.175
```

## Implementation Details

### 1. Fee Calculation Function

**File:** `src/config/platform.ts`

```typescript
export function calculatePlatformFee(amount: number) {
  const feeAmount = Math.floor(amount * PLATFORM_CONFIG.FEE_RATE);
  const constrainedFee = Math.max(
    PLATFORM_CONFIG.MIN_FEE,
    Math.min(feeAmount, PLATFORM_CONFIG.MAX_FEE)
  );
  const netAmount = amount - constrainedFee;
  
  return {
    grossAmount: amount,        // What payer pays
    feeAmount: constrainedFee,  // Platform fee
    netAmount: netAmount,       // What traveler receives
    feeRate: PLATFORM_CONFIG.FEE_RATE,
    feePercentage: (PLATFORM_CONFIG.FEE_RATE * 100).toFixed(1) + '%'
  };
}
```

### 2. Payment Confirmation (Debit)

**File:** `src/app/chat/[conversationId]/page.tsx`

When payer clicks "Pay":

```typescript
const handleConfirmPayment = async () => {
  // 1. Calculate platform fee
  const feeCalculation = calculatePlatformFee(agreedPrice.price);
  
  // 2. Debit full amount from payer
  await fetch('/api/wallet/debit', {
    body: JSON.stringify({
      userId: payerId,
      amount: agreedPrice.price,  // Full amount
      metadata: {
        grossAmount: feeCalculation.grossAmount,
        platformFee: feeCalculation.feeAmount,
        netAmount: feeCalculation.netAmount
      }
    })
  });
  
  // 3. Store fee info in payment message
  const paymentData = {
    amount: agreedPrice.price,
    platformFee: feeCalculation.feeAmount,
    netAmount: feeCalculation.netAmount,
    feeRate: feeCalculation.feeRate,
    feePercentage: feeCalculation.feePercentage
  };
}
```

### 3. Delivery Confirmation (Credit)

**File:** `src/app/chat/[conversationId]/page.tsx`

When traveler confirms delivery:

```typescript
const handleConfirmDelivery = async () => {
  // 1. Get net amount from payment data
  const netAmount = paymentData.netAmount || paymentData.amount;
  const platformFee = paymentData.platformFee || 0;
  
  // 2. Credit NET amount to traveler (after fee)
  await fetch('/api/wallet/credit', {
    body: JSON.stringify({
      userId: travelerId,
      amount: netAmount,  // Amount AFTER platform fee
      metadata: {
        grossAmount: paymentData.amount,
        platformFee: platformFee,
        netAmount: netAmount
      }
    })
  });
  
  // 3. Show breakdown in confirmation
  alert(`
    Gross Amount: ${grossAmount} XAF
    Platform Fee (17.5%): -${platformFee} XAF
    Net Amount Received: ${netAmount} XAF
  `);
}
```

## User Interface

### Payment Card (For Traveler)

When payment is made, the traveler sees:

```
┌─────────────────────────────────────┐
│ 💰 Payment Successful                │
├─────────────────────────────────────┤
│ Payment Amount:      100,000 XAF    │
│ Platform Fee (17.5%): -17,500 XAF   │
│ ────────────────────────────────    │
│ You'll Receive:       82,500 XAF    │
├─────────────────────────────────────┤
│ 1. Deliver the item                 │
│ 2. Ask payer for 6-digit code       │
│ 3. Enter code to receive money      │
└─────────────────────────────────────┘
```

### Delivery Confirmation Card

When delivery is confirmed, both see:

```
┌─────────────────────────────────────┐
│ ✅ Delivery Confirmed!               │
├─────────────────────────────────────┤
│ Payment Released                    │
│                                     │
│ Gross Amount:      100,000 XAF      │
│ Platform Fee:       -17,500 XAF     │
│ ────────────────────────────────    │
│      82,500 XAF                     │
│   Net Amount Received               │
└─────────────────────────────────────┘
```

## Database Records

### Debit Transaction (Payer)
```json
{
  "type": "debit",
  "amount": 100000,
  "category": "Delivery Payment",
  "metadata": {
    "grossAmount": 100000,
    "platformFee": 17500,
    "netAmount": 82500
  }
}
```

### Credit Transaction (Traveler)
```json
{
  "type": "credit",
  "amount": 82500,  // NET amount after fee
  "category": "Delivery Income",
  "metadata": {
    "grossAmount": 100000,
    "platformFee": 17500,
    "netAmount": 82500
  }
}
```

## Revenue Tracking

### How to Track Platform Revenue

**Query all platform fees:**
```sql
SELECT 
  SUM(CAST(json_extract(metadata, '$.platformFee') AS REAL)) as total_fees,
  COUNT(*) as total_transactions,
  AVG(CAST(json_extract(metadata, '$.platformFee') AS REAL)) as avg_fee
FROM Transaction 
WHERE type = 'credit' 
  AND category = 'Delivery Income'
  AND metadata LIKE '%platformFee%';
```

**Query fees by date:**
```sql
SELECT 
  DATE(createdAt) as date,
  SUM(CAST(json_extract(metadata, '$.platformFee') AS REAL)) as daily_fees,
  COUNT(*) as daily_transactions
FROM Transaction 
WHERE type = 'credit' 
  AND category = 'Delivery Income'
  AND metadata LIKE '%platformFee%'
GROUP BY DATE(createdAt)
ORDER BY date DESC;
```

## Fee Examples

| Payment Amount | Fee (17.5%) | Traveler Receives |
|----------------|-------------|-------------------|
| 10,000 XAF     | 1,750 XAF   | 8,250 XAF        |
| 25,000 XAF     | 4,375 XAF   | 20,625 XAF       |
| 50,000 XAF     | 8,750 XAF   | 41,250 XAF       |
| 100,000 XAF    | 17,500 XAF  | 82,500 XAF       |
| 200,000 XAF    | 35,000 XAF  | 165,000 XAF      |
| 500,000 XAF    | 87,500 XAF  | 412,500 XAF      |

## Testing

### Test Scenario 1: Normal Transaction

**Setup:**
- User A: 300,000 XAF
- User B: 300,000 XAF
- Delivery: 100,000 XAF

**Steps:**
1. User A pays 100,000 XAF
2. User A balance: 200,000 XAF
3. User B confirms delivery
4. User B balance: 382,500 XAF (300k + 82.5k)
5. Platform earns: 17,500 XAF

**Verification:**
```bash
# Check User A
curl "http://localhost:3002/api/wallet?userId=USER_A_ID"
# Should show balance: 200000

# Check User B
curl "http://localhost:3002/api/wallet?userId=USER_B_ID"
# Should show balance: 382500

# Check User B's last transaction
# Should show amount: 82500, metadata.platformFee: 17500
```

### Test Scenario 2: Multiple Transactions

**User completes 5 deliveries:**
- Each delivery: 50,000 XAF
- Each fee: 8,750 XAF
- Each net: 41,250 XAF

**Expected Result:**
- Total earned: 206,250 XAF (5 × 41,250)
- Platform revenue: 43,750 XAF (5 × 8,750)
- Total volume: 250,000 XAF (5 × 50,000)

## Advantages of This Implementation

✅ **Transparent**: Users see exactly what they'll receive  
✅ **Fair**: Fee is on earnings, not added to cost  
✅ **Flexible**: Easy to change fee rate  
✅ **Trackable**: All fees recorded in metadata  
✅ **Accurate**: Uses Math.floor() to avoid decimal issues  
✅ **Configurable**: Supports min/max fee limits  
✅ **Auditable**: Full transaction history with fee breakdown

## Future Enhancements

### 1. Tiered Fee Structure
```typescript
// Different rates based on transaction volume
if (amount < 50000) FEE_RATE = 0.20;      // 20% for small
else if (amount < 100000) FEE_RATE = 0.175; // 17.5% for medium
else FEE_RATE = 0.15;                     // 15% for large
```

### 2. Loyalty Program
```typescript
// Reduce fee for frequent users
const userTotalDeliveries = await getUserDeliveryCount(userId);
if (userTotalDeliveries > 50) FEE_RATE = 0.10; // 10% for power users
else if (userTotalDeliveries > 20) FEE_RATE = 0.15; // 15% for active
```

### 3. Platform Wallet
Create a separate wallet to collect all fees:
```typescript
// After crediting traveler
await creditWallet(
  'platform_wallet_id',
  platformFee,
  'Platform fee from delivery',
  'Platform Revenue'
);
```

### 4. Fee Analytics Dashboard
- Total revenue this month
- Revenue by country
- Revenue by delivery type
- Average fee per transaction
- Top earning users (before fees)

## Troubleshooting

### Issue: Traveler receives full amount

**Cause:** Old payment messages without fee data  
**Solution:** Delete old test data or migration script:
```sql
UPDATE Transaction 
SET metadata = json_insert(
  metadata, 
  '$.platformFee', 
  CAST(amount * 0.175 AS INTEGER)
)
WHERE category = 'Delivery Income' 
  AND metadata NOT LIKE '%platformFee%';
```

### Issue: Fee calculation shows decimals

**Cause:** Not using Math.floor()  
**Solution:** Already implemented - fee uses Math.floor()

### Issue: Need to change fee rate

**Solution:** 
1. Edit `src/config/platform.ts`
2. Update `FEE_RATE` value
3. Restart server
4. Only affects NEW transactions

---

**Implementation Date:** October 28, 2025  
**Status:** Production Ready ✅  
**Fee Rate:** 17.5% (Configurable)  
**Location:** `src/config/platform.ts`
