'use client';

import { useEffect, useState } from 'react';

export default function TestOAuth() {
  const [providers, setProviders] = useState<any>(null);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    // Get the current base URL
    setBaseUrl(window.location.origin);
    
    // Fetch NextAuth providers
    fetch('/api/auth/providers')
      .then(res => res.json())
      .then(data => setProviders(data))
      .catch(err => console.error('Error fetching providers:', err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">OAuth Configuration Test</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Current Base URL:</h2>
          <code className="bg-gray-100 p-2 rounded block">{baseUrl}</code>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Required Redirect URIs:</h2>
          <div className="space-y-2">
            <div>
              <strong>Google:</strong>
              <code className="bg-blue-50 p-2 rounded block mt-1">
                {baseUrl}/api/auth/callback/google
              </code>
            </div>
            <div>
              <strong>Facebook:</strong>
              <code className="bg-blue-50 p-2 rounded block mt-1">
                {baseUrl}/api/auth/callback/facebook
              </code>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Available Providers:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
            {providers ? JSON.stringify(providers, null, 2) : 'Loading...'}
          </pre>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Setup Instructions:</h3>
          <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
            <li>Copy the redirect URIs above</li>
            <li>Go to Google Cloud Console and add the Google redirect URI</li>
            <li>Go to Facebook Developers Console and add the Facebook redirect URI</li>
            <li>Save all changes</li>
            <li>Test OAuth sign-in</li>
          </ol>
        </div>

        <div className="mt-6">
          <a 
            href="/auth" 
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
          >
            Back to Auth Page
          </a>
        </div>
      </div>
    </div>
  );
}