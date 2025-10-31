'use client';

import { signIn, getProviders } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Settings } from 'lucide-react';

export default function DebugPage() {
  const [providers, setProviders] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const availableProviders = await getProviders();
        setProviders(availableProviders);
        console.log('Available providers:', availableProviders);
      } catch (error) {
        console.error('Error loading providers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProviders();
  }, []);

  const testProvider = async (providerId: string) => {
    console.log(`Testing ${providerId} provider...`);
    setTestResults(prev => ({
      ...prev,
      [providerId]: 'testing'
    }));

    try {
      const result = await signIn(providerId, {
        redirect: false,
        callbackUrl: '/'
      });
      
      console.log(`${providerId} sign-in result:`, result);
      
      setTestResults(prev => ({
        ...prev,
        [providerId]: result?.error ? 'error' : 'success'
      }));

      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error(`${providerId} sign-in error:`, error);
      setTestResults(prev => ({
        ...prev,
        [providerId]: 'error'
      }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'testing':
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <Settings className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">OAuth Debug Page</h1>
          <p className="text-gray-600">Test and debug OAuth providers for Bagami</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading providers...</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {/* Environment Check */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Environment Configuration
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">NEXTAUTH_URL:</p>
                  <p className="text-gray-600 font-mono">http://localhost:3003</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Current URL:</p>
                  <p className="text-gray-600 font-mono">{typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Google Client ID:</p>
                  <p className="text-gray-600 font-mono">628190604611-79vc0kjglcqj7o5tuhfhdf3nomko9a8g...</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Facebook App ID:</p>
                  <p className="text-gray-600 font-mono">2895373604003219</p>
                </div>
              </div>
            </div>

            {/* Required Redirect URIs */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Required OAuth Redirect URIs</h2>
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-gray-700 mb-2">Google Cloud Console:</p>
                  <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                    http://localhost:3003/api/auth/callback/google
                  </code>
                </div>
                <div>
                  <p className="font-medium text-gray-700 mb-2">Facebook Developer Console:</p>
                  <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                    http://localhost:3003/api/auth/callback/facebook
                  </code>
                </div>
              </div>
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Important:</strong> Make sure these exact URLs are added to your OAuth app configurations.
                  Notice we're using port 3003 now.
                </p>
              </div>
            </div>

            {/* Provider Testing */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Available Providers</h2>
              {providers ? (
                <div className="space-y-4">
                  {Object.values(providers).map((provider: any) => (
                    <div key={provider.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(testResults[provider.id])}
                        <div>
                          <p className="font-medium text-gray-800">{provider.name}</p>
                          <p className="text-sm text-gray-600">ID: {provider.id}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => testProvider(provider.id)}
                        disabled={testResults[provider.id] === 'testing'}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {testResults[provider.id] === 'testing' ? 'Testing...' : 'Test Sign-In'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 font-medium">No providers found!</p>
                  <p className="text-gray-600 text-sm mt-2">Check your NextAuth configuration.</p>
                </div>
              )}
            </div>

            {/* Browser Console Instructions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Debugging Steps</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Open browser Developer Tools (F12)</li>
                <li>Go to the Console tab</li>
                <li>Click "Test Sign-In" for a provider</li>
                <li>Watch for error messages in the console</li>
                <li>Check the Network tab for failed requests</li>
                <li>Look for redirect_uri_mismatch or similar OAuth errors</li>
              </ol>
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <a 
            href="/auth" 
            className="inline-block px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back to Auth Page
          </a>
        </div>
      </div>
    </div>
  );
}