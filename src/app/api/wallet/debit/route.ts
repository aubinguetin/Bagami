import { NextResponse } from 'next/server';
import { debitWallet } from '@/services/walletService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, amount, description, category, referenceId, metadata } = body;

    if (!userId || !amount || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount, description' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Debit wallet
    const result = await debitWallet(
      userId,
      amount,
      description,
      category || 'General',
      referenceId,
      metadata
    );

    return NextResponse.json({
      success: true,
      wallet: result.wallet,
      transaction: result.transaction
    });
  } catch (error) {
    console.error('Error debiting wallet:', error);
    
    // Check if it's an insufficient balance error
    if (error instanceof Error && error.message.includes('Insufficient balance')) {
      return NextResponse.json(
        { error: 'Insufficient balance in wallet' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to debit wallet' },
      { status: 500 }
    );
  }
}
