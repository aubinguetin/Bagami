'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Camera, FileText, CreditCard, CheckCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'

export default function DocumentsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [selectedType, setSelectedType] = useState<'national_id' | 'passport' | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<{
    front?: File
    back?: File
    passport?: File
  }>({})
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const frontInputRef = useRef<HTMLInputElement>(null)
  const backInputRef = useRef<HTMLInputElement>(null)
  const passportInputRef = useRef<HTMLInputElement>(null)

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
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real implementation, you would upload to your storage service here
      // For now, we'll just show success
      setUploadSuccess(true)
      
      setTimeout(() => {
        router.push('/settings')
      }, 2000)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to upload documents</p>
          <button 
            onClick={() => router.push('/auth')}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  if (uploadSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload Successful!</h2>
          <p className="text-gray-600 mb-4">Your documents have been uploaded successfully.</p>
          <p className="text-sm text-gray-500">Redirecting to settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 pt-4">
          <button 
            onClick={() => router.back()}
            className="mr-4 p-2 rounded-full hover:bg-white/50 transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Upload Documents</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          {/* Document Type Selection */}
          {!selectedType && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Document Type</h2>
              
              <button
                onClick={() => setSelectedType('national_id')}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 text-left"
              >
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-8 h-8 text-orange-500" />
                  <div>
                    <h3 className="font-medium text-gray-800">National ID</h3>
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
                    <h3 className="font-medium text-gray-800">Passport</h3>
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
                <h2 className="text-lg font-semibold text-gray-800">
                  Upload {selectedType === 'national_id' ? 'National ID' : 'Passport'}
                </h2>
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
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-orange-300 transition-colors">
                      {uploadedFiles.front ? (
                        <div className="text-green-600">
                          <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm font-medium">{uploadedFiles.front.name}</p>
                        </div>
                      ) : (
                        <div className="text-gray-500">
                          <Upload className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm mb-3">Upload or take a photo of front side</p>
                          <div className="flex gap-3 justify-center">
                            <button
                              onClick={() => frontInputRef.current?.click()}
                              className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium text-sm bg-orange-50 hover:bg-orange-100 px-3 py-2 rounded-lg transition-colors"
                            >
                              <Upload className="w-4 h-4" />
                              Browse Files
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
                              className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium text-sm bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                            >
                              <Camera className="w-4 h-4" />
                              Take Photo
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
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-orange-300 transition-colors">
                      {uploadedFiles.back ? (
                        <div className="text-green-600">
                          <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm font-medium">{uploadedFiles.back.name}</p>
                        </div>
                      ) : (
                        <div className="text-gray-500">
                          <Upload className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm mb-3">Upload or take a photo of back side</p>
                          <div className="flex gap-3 justify-center">
                            <button
                              onClick={() => backInputRef.current?.click()}
                              className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium text-sm bg-orange-50 hover:bg-orange-100 px-3 py-2 rounded-lg transition-colors"
                            >
                              <Upload className="w-4 h-4" />
                              Browse Files
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
                              className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium text-sm bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                            >
                              <Camera className="w-4 h-4" />
                              Take Photo
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
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-orange-300 transition-colors">
                    {uploadedFiles.passport ? (
                      <div className="text-green-600">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">{uploadedFiles.passport.name}</p>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <Upload className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm mb-3">Upload or take a photo of passport information page</p>
                        <div className="flex gap-3 justify-center">
                          <button
                            onClick={() => passportInputRef.current?.click()}
                            className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium text-sm bg-orange-50 hover:bg-orange-100 px-3 py-2 rounded-lg transition-colors"
                          >
                            <Upload className="w-4 h-4" />
                            Browse Files
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
                            className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium text-sm bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                          >
                            <Camera className="w-4 h-4" />
                            Take Photo
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
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your documents will be stored securely. Supported formats: JPEG, PNG, JPG. Maximum file size: 5MB per file.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}