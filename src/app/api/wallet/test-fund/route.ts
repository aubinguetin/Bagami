import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { creditWallet } from '@/services/walletService';

export async function POST(request: Request) {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, phone: true }
    });

    console.log(`Found ${users.length} users to fund`);

    const fundAmount = 100000; // 100,000 FCFA
    const results = [];

    for (const user of users) {
      try {
        // Credit each user's wallet
        const result = await creditWallet(
          user.id,
          fundAmount,
          'Test funding - Initial balance for testing',
          'Bonus',
          `TEST-FUND-${Date.now()}`,
          {
            testFunding: true,
            fundedAt: new Date().toISOString()
          }
        );

        results.push({
          userId: user.id,
          name: user.name || 'Unknown',
          email: user.email,
          phone: user.phone,
          success: true,
          newBalance: result.wallet.balance,
          transactionId: result.transaction.id
        });

        console.log(`✅ Funded ${user.name || user.email}: ${fundAmount} FCFA (New balance: ${result.wallet.balance})`);
      } catch (error: any) {
        console.error(`Error funding user ${user.id}:`, error);
        results.push({
          userId: user.id,
          name: user.name || 'Unknown',
          email: user.email,
          phone: user.phone,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      message: 'Wallet funding complete',
      totalUsers: users.length,
      successful: successCount,
      failed: failCount,
      fundAmount,
      results
    });
  } catch (error) {
    console.error('Error funding wallets:', error);
    return NextResponse.json(
      { error: 'Failed to fund wallets' },
      { status: 500 }
    );
  }
}
