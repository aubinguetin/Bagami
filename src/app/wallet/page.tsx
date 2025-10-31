'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  CreditCard,
  Plus,
  Download,
  Upload,
  Filter,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  category: string;
  date: string;
  referenceId?: string;
}

interface WalletStats {
  balance: number;
  currency: string;
  totalCredit: number;
  totalDebit: number;
  pendingAmount: number;
}

export default function WalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletStats, setWalletStats] = useState<WalletStats>({
    balance: 0,
    currency: 'XAF',
    totalCredit: 0,
    totalDebit: 0,
    pendingAmount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);

  // Authentication check
  useEffect(() => {
    const bagamiAuth = localStorage.getItem('bagami_authenticated');
    
    if (status === 'authenticated' || bagamiAuth === 'true') {
      setIsAuthenticated(true);
    } else if (status === 'unauthenticated' && !bagamiAuth) {
      router.push('/auth');
    }
  }, [status, router]);

  // Mock data - Replace with actual API call later
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchWalletData = async () => {
      setIsLoading(true);
      
      try {
        const currentUserId = localStorage.getItem('bagami_user_id');
        const currentUserContact = localStorage.getItem('bagami_user_contact');

        const params = new URLSearchParams();
        if (currentUserId) params.set('userId', currentUserId);
        if (currentUserContact) params.set('userContact', encodeURIComponent(currentUserContact));

        const response = await fetch(`/api/wallet?${params.toString()}`);
        const data = await response.json();

        if (response.ok) {
          setWalletStats(data.stats);
          setTransactions(data.transactions);
        } else {
          console.error('Error fetching wallet data:', data.error);
        }
      } catch (error) {
        console.error('Error fetching wallet data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletData();
  }, [isAuthenticated]);

  const formatCurrency = (amount: number, currency: string = 'XAF') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filterType === 'all') return true;
    return transaction.type === filterType;
  });

  if (status === 'loading' || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-slate-800">My Wallet</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-2xl p-6 shadow-xl mb-4 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-medium">Available Balance</p>
                  <p className="text-xs text-white/60">{walletStats.currency}</p>
                </div>
              </div>
              <button
                onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label={isBalanceHidden ? 'Show balance' : 'Hide balance'}
              >
                {isBalanceHidden ? (
                  <EyeOff className="w-5 h-5 text-white/90" />
                ) : (
                  <Eye className="w-5 h-5 text-white/90" />
                )}
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-4xl font-bold text-white mb-1">
                {isBalanceHidden 
                  ? '* * * * * *' 
                  : formatCurrency(walletStats.balance, walletStats.currency)
                }
              </h2>
              {walletStats.pendingAmount > 0 && (
                <p className="text-white/70 text-xs flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {isBalanceHidden 
                      ? '* * * * * * pending' 
                      : `${formatCurrency(walletStats.pendingAmount)} pending`
                    }
                  </span>
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button className="bg-white/95 backdrop-blur-sm hover:bg-white text-orange-600 font-semibold py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl active:scale-95">
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add Money</span>
              </button>
              <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 border border-white/30 active:scale-95">
                <Download className="w-4 h-4" />
                <span className="text-sm">Withdraw</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs text-gray-600 font-medium">Credit</span>
            </div>
            <p className="text-xl font-bold text-gray-800">
              {isBalanceHidden ? '* * * * * *' : formatCurrency(walletStats.totalCredit)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-xs text-gray-600 font-medium">Debit</span>
            </div>
            <p className="text-xl font-bold text-gray-800">
              {isBalanceHidden ? '* * * * * *' : formatCurrency(walletStats.totalDebit)}
            </p>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Transactions Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-800">Transactions</h3>
              <button className="text-xs text-orange-600 hover:text-orange-700 font-semibold">
                View All
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterType('all')}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  filterType === 'all'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('credit')}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  filterType === 'credit'
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Income
              </button>
              <button
                onClick={() => setFilterType('debit')}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  filterType === 'debit'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Expenses
              </button>
            </div>
          </div>

          {/* Transactions List */}
          <div className="divide-y divide-gray-100">
            {isLoading ? (
              // Loading state
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="p-4 animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100"
                >
                  <div className="flex items-center space-x-3">
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        transaction.type === 'credit'
                          ? 'bg-green-100'
                          : 'bg-red-100'
                      }`}
                    >
                      {transaction.type === 'credit' ? (
                        <ArrowDownLeft className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-600" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1 mb-0.5">
                        <h4 className="font-semibold text-sm text-gray-800 truncate">
                          {transaction.description}
                        </h4>
                        {getStatusIcon(transaction.status)}
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <span className="truncate">{transaction.category}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(transaction.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p
                        className={`font-bold text-sm ${
                          transaction.type === 'credit'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'credit' ? '+' : '-'}
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </p>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(
                          transaction.status
                        )}`}
                      >
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Empty state
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Wallet className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800 mb-1">
                  No Transactions Found
                </h3>
                <p className="text-xs text-gray-600">
                  {filterType === 'all'
                    ? 'Your transaction history will appear here'
                    : `No ${filterType === 'credit' ? 'income' : 'expense'} transactions found`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-gray-800">Payment Methods</h3>
            <button className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center space-x-1">
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">Mobile Money</p>
                <p className="text-xs text-gray-600">MTN: •••• 1234</p>
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-200 px-2 py-1 rounded-full">
                Primary
              </span>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">Orange Money</p>
                <p className="text-xs text-gray-600">•••• 5678</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
