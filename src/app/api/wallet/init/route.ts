import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateWallet } from '@/services/walletService';

export async function POST(request: Request) {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true }
    });

    console.log(`Found ${users.length} users`);

    // Create wallets for all users
    const results = [];
    for (const user of users) {
      try {
        const wallet = await getOrCreateWallet(user.id);
        results.push({
          userId: user.id,
          name: user.name,
          email: user.email,
          wallet: {
            id: wallet.id,
            balance: wallet.balance,
            currency: wallet.currency
          }
        });
      } catch (error) {
        console.error(`Error creating wallet for user ${user.id}:`, error);
        results.push({
          userId: user.id,
          name: user.name,
          email: user.email,
          error: 'Failed to create wallet'
        });
      }
    }

    return NextResponse.json({
      message: 'Wallet initialization complete',
      totalUsers: users.length,
      results
    });
  } catch (error) {
    console.error('Error initializing wallets:', error);
    return NextResponse.json(
      { error: 'Failed to initialize wallets' },
      { status: 500 }
    );
  }
}
