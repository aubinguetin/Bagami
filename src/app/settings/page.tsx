 'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft,
  User,
  Shield,
  Lock,
  Globe,
  DollarSign,
  ChevronRight,
  X,
  Upload,
  Camera,
  FileText,
  CreditCard,
  CheckCircle,
  Eye,
  Trash2
} from 'lucide-react';
import ChangePasswordModal from '@/components/ChangePasswordModal';

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  // Modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'national_id' | 'passport' | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{
    front?: File
    back?: File
    passport?: File
  }>({});
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Existing ID documents state
  const [documents, setDocuments] = useState<Array<{
    id: string;
    documentType: 'national_id' | 'passport' | string;
    frontImagePath: string | null;
    backImagePath: string | null;
    uploadedAt: string;
  }>>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);

  const loadDocuments = async () => {
    if (!session?.user?.id) return;
    setLoadingDocs(true);
    setDocsError(null);
    try {
      const res = await fetch('/api/id-documents', { method: 'GET' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load documents');
      setDocuments(data.documents || []);
    } catch (e) {
      setDocsError(e instanceof Error ? e.message : 'Failed to load documents');
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (showVerifyModal) {
      loadDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showVerifyModal, session?.user?.id]);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const passportInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (type: 'front' | 'back' | 'passport', file: File) => {
    // Simple client-side validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, JPG)')
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert('File size must be less than 5MB')
      return
    }

    setUploadedFiles(prev => ({
      ...prev,
      [type]: file
    }))
  }

  const handleSubmit = async () => {
    if (!selectedType) return

    const requiredFiles = selectedType === 'national_id' 
      ? ['front', 'back'] 
      : ['passport']

    const missingFiles = requiredFiles.filter(file => !uploadedFiles[file as keyof typeof uploadedFiles])
    
    if (missingFiles.length > 0) {
      alert('Please upload all required documents')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('documentType', selectedType)
      
      if (selectedType === 'national_id') {
        if (uploadedFiles.front) formData.append('frontImage', uploadedFiles.front)
        if (uploadedFiles.back) formData.append('backImage', uploadedFiles.back)
      } else if (selectedType === 'passport') {
        if (uploadedFiles.passport) formData.append('frontImage', uploadedFiles.passport)
      }

      const response = await fetch('/api/id-documents', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      console.log('Upload successful:', result)
      
      setUploadSuccess(true)
      // Refresh existing documents list
      loadDocuments()
      
      setTimeout(() => {
        setShowVerifyModal(false)
        setUploadSuccess(false)
        setSelectedType(null)
        setUploadedFiles({})
      }, 2000)
    } catch (error) {
      console.error('Upload failed:', error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
          <div className="w-9 h-9"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Settings Content */}
      <div className="px-4 py-4 space-y-3 max-w-md mx-auto">
        
        {/* Account Settings Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="space-y-1">
            <button 
              onClick={() => router.push('/settings/my-information')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-gray-600 group-hover:text-orange-600 transition-colors" />
                <span className="font-medium text-gray-700 group-hover:text-orange-700">My Information</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
            </button>

            <button 
              onClick={() => setShowVerifyModal(true)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <Shield className="w-4 h-4 text-gray-600 group-hover:text-orange-600 transition-colors" />
                <span className="font-medium text-gray-700 group-hover:text-orange-700">Verify my ID</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
            </button>

            <button 
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <Lock className="w-4 h-4 text-gray-600 group-hover:text-orange-600 transition-colors" />
                <span className="font-medium text-gray-700 group-hover:text-orange-700">Password</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
            </button>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="space-y-1">
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition-all duration-200 group">
              <div className="flex items-center space-x-3">
                <Globe className="w-4 h-4 text-gray-600 group-hover:text-orange-600 transition-colors" />
                <div className="flex-1 flex items-center justify-between">
                  <span className="font-medium text-gray-700 group-hover:text-orange-700">Language</span>
                  <span className="text-sm text-gray-500">English</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
            </button>

            <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition-all duration-200 group">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-4 h-4 text-gray-600 group-hover:text-orange-600 transition-colors" />
                <div className="flex-1 flex items-center justify-between">
                  <span className="font-medium text-gray-700 group-hover:text-orange-700">Currency</span>
                  <span className="text-sm text-gray-500">EUR (€)</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
            </button>
          </div>
        </div>

      </div>

      {/* Verify ID Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">Verify my ID</h2>
              <button
                onClick={() => {
                  setShowVerifyModal(false)
                  setSelectedType(null)
                  setUploadedFiles({})
                  setUploadSuccess(false)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {!session ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Please sign in to verify your ID</p>
                  <button 
                    onClick={() => {
                      setShowVerifyModal(false)
                      router.push('/auth')
                    }}
                    className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              ) : uploadSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Upload Successful!</h3>
                  <p className="text-gray-600">Your documents have been uploaded successfully.</p>
                </div>
              ) : (
                <>
                  {/* Existing Documents Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800">Your uploaded IDs</h3>
                      {loadingDocs && <span className="text-xs text-gray-500">Loading…</span>}
                    </div>
                    {docsError && (
                      <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">{docsError}</div>
                    )}
                    {documents.length > 0 ? (
                      <div className="space-y-3">
                        {documents.map((doc) => (
                          <div key={doc.id} className="border border-gray-200 rounded-xl p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {doc.documentType === 'passport' ? (
                                  <FileText className="w-6 h-6 text-blue-500" />
                                ) : (
                                  <CreditCard className="w-6 h-6 text-orange-500" />
                                )}
                                <div>
                                  <div className="text-sm font-medium text-gray-800 capitalize">{doc.documentType.replace('_', ' ')}</div>
                                  <div className="text-xs text-gray-500">Uploaded {new Date(doc.uploadedAt).toLocaleString()}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    if (doc.frontImagePath) window.open(doc.frontImagePath, '_blank')
                                    if (doc.backImagePath) window.open(doc.backImagePath, '_blank')
                                  }}
                                  className="text-gray-700 hover:text-orange-600 text-xs px-2 py-1 rounded-md border border-gray-200 flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" /> View
                                </button>
                                <button
                                  onClick={() => setSelectedType(doc.documentType as any)}
                                  className="text-gray-700 hover:text-orange-600 text-xs px-2 py-1 rounded-md border border-gray-200"
                                >
                                  Replace
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!confirm('Delete this document?')) return;
                                    try {
                                      const res = await fetch('/api/id-documents', {
                                        method: 'DELETE',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ id: doc.id })
                                      })
                                      const data = await res.json()
                                      if (!res.ok) throw new Error(data.error || 'Failed to delete document')
                                      await loadDocuments()
                                    } catch (e) {
                                      alert(e instanceof Error ? e.message : 'Failed to delete document')
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-700 text-xs px-2 py-1 rounded-md border border-red-200 flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete
                                </button>
                              </div>
                            </div>
                            <div className="mt-3 flex gap-2">
                              {doc.frontImagePath && (
                                <img src={doc.frontImagePath} alt="Front" className="w-20 h-14 object-cover rounded-lg border" />
                              )}
                              {doc.backImagePath && (
                                <img src={doc.backImagePath} alt="Back" className="w-20 h-14 object-cover rounded-lg border" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">No IDs uploaded yet.</div>
                    )}
                  </div>

                  {/* Document Type Selection */}
                  {!selectedType && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Document Type</h3>
                      
                      <button
                        onClick={() => setSelectedType('national_id')}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <CreditCard className="w-8 h-8 text-orange-500" />
                          <div>
                            <h4 className="font-medium text-gray-800">National ID</h4>
                            <p className="text-sm text-gray-500">Upload front and back of your national ID</p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setSelectedType('passport')}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="w-8 h-8 text-blue-500" />
                          <div>
                            <h4 className="font-medium text-gray-800">Passport</h4>
                            <p className="text-sm text-gray-500">Upload your passport information page</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* File Upload Section */}
                  {selectedType && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Upload {selectedType === 'national_id' ? 'National ID' : 'Passport'}
                        </h3>
                        <button
                          onClick={() => {
                            setSelectedType(null)
                            setUploadedFiles({})
                          }}
                          className="text-sm text-gray-500 hover:text-gray-700 underline"
                        >
                          Change type
                        </button>
                      </div>

                      {selectedType === 'national_id' && (
                        <>
                          {/* Front Side */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Front Side</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-orange-300 transition-colors">
                              {uploadedFiles.front ? (
                                <div className="text-green-600">
                                  <CheckCircle className="w-6 h-6 mx-auto mb-1" />
                                  <p className="text-xs font-medium">{uploadedFiles.front.name}</p>
                                </div>
                              ) : (
                                <div className="text-gray-500">
                                  <Upload className="w-6 h-6 mx-auto mb-2" />
                                  <p className="text-xs mb-2">Upload or take photo of front side</p>
                                  <div className="flex gap-2 justify-center">
                                    <button
                                      onClick={() => frontInputRef.current?.click()}
                                      className="flex items-center gap-1 text-orange-500 hover:text-orange-600 font-medium text-xs bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded-lg transition-colors"
                                    >
                                      <Upload className="w-3 h-3" />
                                      Browse
                                    </button>
                                    <button
                                      onClick={() => {
                                        const input = document.createElement('input')
                                        input.type = 'file'
                                        input.accept = 'image/*'
                                        input.capture = 'environment'
                                        input.onchange = (e) => {
                                          const file = (e.target as HTMLInputElement).files?.[0]
                                          if (file) handleFileSelect('front', file)
                                        }
                                        input.click()
                                      }}
                                      className="flex items-center gap-1 text-blue-500 hover:text-blue-600 font-medium text-xs bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors"
                                    >
                                      <Camera className="w-3 h-3" />
                                      Camera
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            <input
                              ref={frontInputRef}
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileSelect('front', file)
                              }}
                              className="hidden"
                            />
                          </div>

                          {/* Back Side */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Back Side</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-orange-300 transition-colors">
                              {uploadedFiles.back ? (
                                <div className="text-green-600">
                                  <CheckCircle className="w-6 h-6 mx-auto mb-1" />
                                  <p className="text-xs font-medium">{uploadedFiles.back.name}</p>
                                </div>
                              ) : (
                                <div className="text-gray-500">
                                  <Upload className="w-6 h-6 mx-auto mb-2" />
                                  <p className="text-xs mb-2">Upload or take photo of back side</p>
                                  <div className="flex gap-2 justify-center">
                                    <button
                                      onClick={() => backInputRef.current?.click()}
                                      className="flex items-center gap-1 text-orange-500 hover:text-orange-600 font-medium text-xs bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded-lg transition-colors"
                                    >
                                      <Upload className="w-3 h-3" />
                                      Browse
                                    </button>
                                    <button
                                      onClick={() => {
                                        const input = document.createElement('input')
                                        input.type = 'file'
                                        input.accept = 'image/*'
                                        input.capture = 'environment'
                                        input.onchange = (e) => {
                                          const file = (e.target as HTMLInputElement).files?.[0]
                                          if (file) handleFileSelect('back', file)
                                        }
                                        input.click()
                                      }}
                                      className="flex items-center gap-1 text-blue-500 hover:text-blue-600 font-medium text-xs bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors"
                                    >
                                      <Camera className="w-3 h-3" />
                                      Camera
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            <input
                              ref={backInputRef}
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileSelect('back', file)
                              }}
                              className="hidden"
                            />
                          </div>
                        </>
                      )}

                      {selectedType === 'passport' && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Information Page</label>
                          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-orange-300 transition-colors">
                            {uploadedFiles.passport ? (
                              <div className="text-green-600">
                                <CheckCircle className="w-6 h-6 mx-auto mb-1" />
                                <p className="text-xs font-medium">{uploadedFiles.passport.name}</p>
                              </div>
                            ) : (
                              <div className="text-gray-500">
                                <Upload className="w-6 h-6 mx-auto mb-2" />
                                <p className="text-xs mb-2">Upload or take photo of passport info page</p>
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => passportInputRef.current?.click()}
                                    className="flex items-center gap-1 text-orange-500 hover:text-orange-600 font-medium text-xs bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded-lg transition-colors"
                                  >
                                    <Upload className="w-3 h-3" />
                                    Browse
                                  </button>
                                  <button
                                    onClick={() => {
                                      const input = document.createElement('input')
                                      input.type = 'file'
                                      input.accept = 'image/*'
                                      input.capture = 'environment'
                                      input.onchange = (e) => {
                                        const file = (e.target as HTMLInputElement).files?.[0]
                                        if (file) handleFileSelect('passport', file)
                                      }
                                      input.click()
                                    }}
                                    className="flex items-center gap-1 text-blue-500 hover:text-blue-600 font-medium text-xs bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors"
                                  >
                                    <Camera className="w-3 h-3" />
                                    Camera
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          <input
                            ref={passportInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileSelect('passport', file)
                            }}
                            className="hidden"
                          />
                        </div>
                      )}

                      {/* Submit Button */}
                      <button
                        onClick={handleSubmit}
                        disabled={uploading || (
                          selectedType === 'national_id' 
                            ? !uploadedFiles.front || !uploadedFiles.back
                            : !uploadedFiles.passport
                        )}
                        className="w-full bg-orange-500 text-white py-3 px-4 rounded-xl hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {uploading ? 'Uploading...' : 'Upload Documents'}
                      </button>
                    </div>
                  )}

                  {/* Info Note */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-xs text-blue-800">
                      <strong>Note:</strong> Your documents will be stored securely. Supported formats: JPEG, PNG, JPG. Maximum file size: 5MB per file.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}