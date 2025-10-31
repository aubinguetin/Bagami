import { NextResponse } from 'next/server';
import { getWalletStats, getUserTransactions } from '@/services/walletService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userContact = searchParams.get('userContact');
    const type = searchParams.get('type') as 'credit' | 'debit' | undefined;
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    if (!userId && !userContact) {
      return NextResponse.json(
        { error: 'User ID or contact is required' },
        { status: 400 }
      );
    }

    // Import prisma here to avoid circular dependencies
    const { prisma } = await import('@/lib/prisma');

    // Find user
    let user;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    } else if (userContact) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: userContact },
            { phone: userContact }
          ]
        }
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get wallet stats and transactions
    const [stats, transactions] = await Promise.all([
      getWalletStats(user.id),
      getUserTransactions(user.id, {
        type,
        status: status || undefined,
        limit: limit ? parseInt(limit) : 50
      })
    ]);

    return NextResponse.json({
      stats,
      transactions: transactions.map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        description: t.description,
        category: t.category,
        date: t.createdAt.toISOString(),
        referenceId: t.referenceId,
        metadata: t.metadata ? JSON.parse(t.metadata) : null
      }))
    });
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet data' },
      { status: 500 }
    );
  }
}
