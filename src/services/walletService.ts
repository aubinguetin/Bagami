import { prisma } from '@/lib/prisma';
import { getUserLocale, generateTransactionNotification } from '@/lib/notificationTranslations';
import { sendNotificationToUser } from '@/lib/push/fcm';

export interface TransactionData {
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  currency?: string;
  status?: 'completed' | 'pending' | 'failed';
  description: string;
  category: string;
  referenceId?: string;
  metadata?: Record<string, any>;
}

/**
 * Get or create wallet for a user
 */
export async function getOrCreateWallet(userId: string) {
  let wallet = await prisma.wallet.findUnique({
    where: { userId }
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId,
        balance: 0,
        currency: 'XOF'
      }
    });
  }

  return wallet;
}

/**
 * Create a transaction and update wallet balance atomically
 */
export async function createTransaction(data: TransactionData) {
  const {
    userId,
    type,
    amount,
    currency = 'XOF',
    status = 'completed',
    description,
    category,
    referenceId,
    metadata
  } = data;

  // Use interactive transaction to ensure data integrity
  return prisma.$transaction(async (tx) => {
    // 0. Idempotency Check: Prevent duplicate processing for same referenceId
    // Only applies if referenceId is provided and we are trying to create a completed transaction
    if (referenceId && status === 'completed') {
      const existingTransaction = await tx.transaction.findFirst({
        where: {
          referenceId,
          type, // Ensure we check for same type (credit/debit)
          status: 'completed'
        }
      });

      if (existingTransaction) {
        console.log(`⚠️ Idempotency check: Transaction ${referenceId} already exists. Skipping.`);
        const currentWallet = await tx.wallet.findUnique({ where: { userId } });
        return { transaction: existingTransaction, wallet: currentWallet };
      }
    }

    // 1. If debit, check balance INSIDE the transaction (lock check)
    if (type === 'debit' && status === 'completed') {
      const currentWallet = await tx.wallet.findUnique({
        where: { userId }
      });

      if (!currentWallet || currentWallet.balance < amount) {
        throw new Error('Insufficient balance');
      }
    }

    // 2. Create the transaction record
    const transaction = await tx.transaction.create({
      data: {
        userId,
        type,
        amount,
        currency,
        status,
        description,
        category,
        referenceId,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    // 3. Atomically update wallet balance
    let updatedWallet;
    if (status === 'completed') {
      const updateData = type === 'credit'
        ? { balance: { increment: amount } }
        : { balance: { decrement: amount } };

      updatedWallet = await tx.wallet.update({
        where: { userId },
        data: updateData
      });
    } else {
      // If pending/failed, just get the wallet
      updatedWallet = await getOrCreateWallet(userId);
    }

    // sending notification side-effect (outside of critical path, not awaited blockingly)
    // We do this after transaction succeeds (conceptually), but here it's fine 
    // to trigger async promise or wait. 
    // To match original logic, we'll trigger it async after.

    return { transaction, wallet: updatedWallet };
  }).then(async (result) => {
    // 4. Send notification (async, non-blocking)
    try {
      const locale = await getUserLocale(userId);
      const { title, message } = generateTransactionNotification(
        type,
        category,
        amount,
        currency,
        description,
        locale
      );

      await prisma.notification.create({
        data: {
          userId,
          type: 'transaction',
          title,
          message,
          relatedId: result.transaction.id,
          isRead: false
        }
      });
      sendNotificationToUser({ userId, title, body: message, data: { relatedId: result.transaction.id } });
    } catch (error) {
      console.error('Failed to create transaction notification:', error);
    }

    return result;
  });
}

/**
 * Credit user wallet (add money)
 */
export async function creditWallet(
  userId: string,
  amount: number,
  description: string,
  category: string,
  referenceId?: string,
  metadata?: Record<string, any>
) {
  return createTransaction({
    userId,
    type: 'credit',
    amount,
    description,
    category,
    referenceId,
    metadata
  });
}

/**
 * Debit user wallet (subtract money)
 */
export async function debitWallet(
  userId: string,
  amount: number,
  description: string,
  category: string,
  referenceId?: string,
  metadata?: Record<string, any>
) {
  // Ensure wallet exists before transaction (optional optimization)
  await getOrCreateWallet(userId);

  return createTransaction({
    userId,
    type: 'debit',
    amount,
    description,
    category,
    referenceId,
    metadata
  });
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(userId: string) {
  const wallet = await getOrCreateWallet(userId);
  return wallet.balance;
}

/**
 * Get user transactions
 */
export async function getUserTransactions(
  userId: string,
  options?: {
    type?: 'credit' | 'debit';
    status?: string;
    limit?: number;
    offset?: number;
  }
) {
  const where: any = { userId };

  if (options?.type) {
    where.type = options.type;
  }

  if (options?.status) {
    where.status = options.status;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
    skip: options?.offset || 0
  });

  return transactions;
}

/**
 * Get wallet stats
 */
export async function getWalletStats(userId: string) {
  const wallet = await getOrCreateWallet(userId);

  const [creditTransactions, debitTransactions, pendingTransactions] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: 'credit', status: 'completed' },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'debit', status: 'completed' },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: { userId, status: 'pending' },
      _sum: { amount: true }
    })
  ]);

  return {
    balance: wallet.balance,
    currency: wallet.currency,
    totalCredit: creditTransactions._sum.amount || 0,
    totalDebit: debitTransactions._sum.amount || 0,
    pendingAmount: pendingTransactions._sum.amount || 0
  };
}
