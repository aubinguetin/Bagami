import { NextResponse } from 'next/server';
import { creditWallet, debitWallet } from '@/services/walletService';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { deliveryId, senderId, receiverId, amount } = body;

    if (!deliveryId || !senderId || !receiverId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get delivery details
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        sender: true,
        receiver: true
      }
    });

    if (!delivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    // Determine who pays whom based on delivery type
    let payerId: string;
    let recipientId: string;
    let description: string;

    if (delivery.type === 'request') {
      // Request: sender (requester) pays receiver (traveler)
      payerId = senderId;
      recipientId = receiverId;
      description = `Payment for delivery from ${delivery.fromCity} to ${delivery.toCity}`;
    } else {
      // Offer: receiver (customer) pays sender (traveler)
      payerId = receiverId;
      recipientId = senderId;
      description = `Payment for travel offer from ${delivery.fromCity} to ${delivery.toCity}`;
    }

    // Calculate service fee (5%)
    const serviceFee = amount * 0.05;
    const recipientAmount = amount - serviceFee;

    // Create transactions
    try {
      // Debit payer
      await debitWallet(
        payerId,
        amount,
        description,
        'Delivery Payment',
        deliveryId,
        {
          deliveryId,
          deliveryType: delivery.type,
          serviceFee,
          recipientAmount
        }
      );

      // Credit recipient (minus service fee)
      await creditWallet(
        recipientId,
        recipientAmount,
        description,
        'Delivery Payment',
        deliveryId,
        {
          deliveryId,
          deliveryType: delivery.type,
          serviceFee,
          originalAmount: amount
        }
      );

      // Credit service fee to platform (you can have a platform wallet)
      // For now, we'll just record it as a transaction
      // await creditWallet(platformUserId, serviceFee, 'Service Fee', 'Fee', deliveryId);

      return NextResponse.json({
        success: true,
        message: 'Payment processed successfully',
        amount,
        recipientAmount,
        serviceFee
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Payment processing failed' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing delivery payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
