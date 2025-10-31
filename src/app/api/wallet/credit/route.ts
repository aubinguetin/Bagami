import { NextResponse } from 'next/server';
import { creditWallet } from '@/services/walletService';

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

    // Credit wallet
    const result = await creditWallet(
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
    console.error('Error crediting wallet:', error);
    return NextResponse.json(
      { error: 'Failed to credit wallet' },
      { status: 500 }
    );
  }
}
