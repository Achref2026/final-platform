import React, { useState, useRef } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const DocumentUpload = ({ documentType, onUploadSuccess, onCancel }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const documentTypeLabels = {
    profile_photo: 'Profile Photo',
    id_card: 'ID Card',
    medical_certificate: 'Medical Certificate',
    driving_license: 'Driving License',
    teaching_license: 'Teaching License'
  };

  const documentTypeIcons = {
    profile_photo: '📸',
    id_card: '🆔',
    medical_certificate: '🏥',
    driving_license: '🚗',
    teaching_license: '👨‍🏫'
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      uploadDocument(file);
    }
  };

  const uploadDocument = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Validate file
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB');
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only JPEG, PNG, and PDF files are allowed');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);

      // Get auth token
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Please login to upload documents');
      }

      // Upload file
      const response = await axios.post(
        `${BACKEND_URL}/api/documents/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
          }
        }
      );

      if (response.status === 200) {
        setUploadProgress(100);
        setTimeout(() => {
          if (onUploadSuccess) {
            onUploadSuccess(response.data);
          }
        }, 500);
      }

    } catch (err) {
      console.error('Upload error:', err);
      
      let errorMessage = 'Upload failed';
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="document-upload-container">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">
          {documentTypeIcons[documentType] || '📄'}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Upload {documentTypeLabels[documentType] || 'Document'}
        </h3>
        <p className="text-gray-600">
          Supported formats: JPEG, PNG, PDF (max 10MB)
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-red-600 text-2xl mr-3">⚠️</span>
            <div>
              <h4 className="text-red-800 font-bold">Upload Error</h4>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {isUploading ? (
        <div className="upload-progress">
          <div className="text-center mb-4">
            <div className="loading-spinner mx-auto mb-2"></div>
            <p className="text-gray-600">Uploading... {uploadProgress}%</p>
          </div>
          
          <div className="progress-bar-container mb-4">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          
          {uploadProgress === 100 && (
            <div className="text-center text-green-600">
              <span className="text-2xl">✅</span>
              <p className="font-medium">Upload completed successfully!</p>
            </div>
          )}
        </div>
      ) : (
        <div className="upload-area">
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div 
            className="upload-dropzone"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center">
              <div className="text-4xl mb-4">📁</div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                Click to select file
              </p>
              <p className="text-sm text-gray-600 mb-4">
                or drag and drop your file here
              </p>
              <div className="btn-primary inline-block">
                Choose File
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-4 mt-6">
        <button
          onClick={onCancel}
          className="btn-secondary flex-1"
          disabled={isUploading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default DocumentUpload;
