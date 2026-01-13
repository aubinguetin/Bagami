import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import * as walletService from './walletService';

// Mock the prisma module
vi.mock('@/lib/prisma', () => ({
    prisma: mockDeep<PrismaClient>(),
}));

// Cast the mocked prisma to the MockProxy type
const prismaMock = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>;

// Mock notification side effects to avoid errors
vi.mock('@/lib/notificationTranslations', () => ({
    getUserLocale: vi.fn().mockResolvedValue('en'),
    generateTransactionNotification: vi.fn().mockReturnValue({ title: 'Test', message: 'Test Message' }),
}));
vi.mock('@/lib/push/fcm', () => ({
    sendNotificationToUser: vi.fn(),
}));

describe('WalletService', () => {
    beforeEach(() => {
        mockReset(prismaMock);
        // Mock $transaction to immediately execute the callback with the prismaMock as the tx client
        prismaMock.$transaction.mockImplementation((callback) => callback(prismaMock));
    });

    describe('getOrCreateWallet', () => {
        it('should return existing wallet if found', async () => {
            const mockWallet = { id: 'w1', userId: 'u1', balance: 100, currency: 'XOF' };
            prismaMock.wallet.findUnique.mockResolvedValue(mockWallet as any);

            const result = await walletService.getOrCreateWallet('u1');

            expect(prismaMock.wallet.findUnique).toHaveBeenCalledWith({ where: { userId: 'u1' } });
            expect(result).toEqual(mockWallet);
        });

        it('should create new wallet if not found', async () => {
            prismaMock.wallet.findUnique.mockResolvedValue(null);
            const newWallet = { id: 'w1', userId: 'u1', balance: 0, currency: 'XOF' };
            prismaMock.wallet.create.mockResolvedValue(newWallet as any);

            const result = await walletService.getOrCreateWallet('u1');

            expect(prismaMock.wallet.create).toHaveBeenCalledWith({
                data: {
                    userId: 'u1',
                    balance: 0,
                    currency: 'XOF'
                }
            });
            expect(result).toEqual(newWallet);
        });
    });

    describe('creditWallet', () => {
        it('should use atomic increment for crediting balance', async () => {
            const amount = 5000;
            const userId = 'u1';

            // Mock db responses
            prismaMock.transaction.create.mockResolvedValue({ id: 't1' } as any);
            prismaMock.notification.create.mockResolvedValue({} as any);

            // Mock successful update
            const updatedWallet = { id: 'w1', balance: 5000 };
            prismaMock.wallet.update.mockResolvedValue(updatedWallet as any);

            await walletService.creditWallet(userId, amount, 'Topup', 'topup');

            // VERIFY ATOMIC UPDATE: balance: { increment: amount }
            expect(prismaMock.wallet.update).toHaveBeenCalledWith({
                where: { userId },
                data: { balance: { increment: amount } }
            });

            // Verify transaction record created
            expect(prismaMock.transaction.create).toHaveBeenCalled();
        });
    });

    describe('debitWallet', () => {
        it('should use atomic decrement for debiting balance', async () => {
            const amount = 2000;
            const userId = 'u1';

            // Setup mock to pass the "insufficient balance" check inside transaction
            // The logic performs a findUnique first
            prismaMock.wallet.findUnique.mockResolvedValue({ id: 'w1', balance: 5000 } as any);

            prismaMock.transaction.create.mockResolvedValue({ id: 't2' } as any);
            prismaMock.notification.create.mockResolvedValue({} as any);
            prismaMock.wallet.update.mockResolvedValue({ id: 'w1', balance: 3000 } as any);

            await walletService.debitWallet(userId, amount, 'Payment', 'payment');

            // VERIFY ATOMIC UPDATE: balance: { decrement: amount }
            expect(prismaMock.wallet.update).toHaveBeenCalledWith({
                where: { userId },
                data: { balance: { decrement: amount } }
            });
        });

        it('should throw error if balance is insufficient', async () => {
            const amount = 10000;
            const userId = 'u1';

            // Mock wallet with low balance
            prismaMock.wallet.findUnique.mockResolvedValue({ id: 'w1', balance: 500 } as any);

            await expect(walletService.debitWallet(userId, amount, 'Payment', 'payment'))
                .rejects.toThrow('Insufficient balance');

            // Should NOT update wallet
            expect(prismaMock.wallet.update).not.toHaveBeenCalled();
        });
    });

    describe('createTransaction Idempotency', () => {
        it('should detect duplicate transaction by referenceId and skip processing', async () => {
            const referenceId = 'ref_123';
            const userId = 'u1';

            // Mock finding an existing completed transaction
            prismaMock.transaction.findFirst.mockResolvedValue({
                id: 'existing_tx',
                referenceId,
                status: 'completed'
            } as any);

            // Mock wallet fetch for return
            prismaMock.wallet.findUnique.mockResolvedValue({ id: 'w1', balance: 100 } as any);

            const result = await walletService.createTransaction({
                userId,
                type: 'credit',
                amount: 100,
                description: 'Duplicate',
                category: 'test',
                referenceId,
                status: 'completed'
            });

            // Should verify that findFirst was called
            expect(prismaMock.transaction.findFirst).toHaveBeenCalledWith({
                where: {
                    referenceId,
                    type: 'credit',
                    status: 'completed'
                }
            });

            // Should NOT create a new transaction
            expect(prismaMock.transaction.create).not.toHaveBeenCalled();

            // Should NOT update wallet
            expect(prismaMock.wallet.update).not.toHaveBeenCalled();

            // Should return the existing transaction
            expect(result.transaction.id).toBe('existing_tx');
        });
    });
});
