import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const DocumentList = ({ userId, canVerify = false }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    fetchDocuments();
  }, [userId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Please login to view documents');
      }

      const endpoint = userId 
        ? `/api/documents/${userId}` 
        : '/api/documents/my';

      const response = await axios.get(`${BACKEND_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setDocuments(response.data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      
      let errorMessage = 'Failed to load documents';
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const verifyDocument = async (documentId) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${BACKEND_URL}/api/documents/${documentId}/verify`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Refresh documents list
      fetchDocuments();
      alert('Document verified successfully!');
    } catch (err) {
      console.error('Error verifying document:', err);
      alert('Failed to verify document');
    }
  };

  const openDocument = (fileUrl) => {
    window.open(fileUrl, '_blank');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-gray-600">Loading documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 text-4xl mb-4">❌</div>
        <h3 className="text-lg font-bold text-red-800 mb-2">Error</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchDocuments}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <div className="text-6xl mb-4">📄</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No documents found</h3>
        <p className="text-gray-600">
          {userId ? 'This user has not uploaded any documents yet.' : 'You have not uploaded any documents yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="documents-list">
      <div className="grid gap-6">
        {documents.map((document) => (
          <div key={document.id} className="document-card">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-3xl">
                  {documentTypeIcons[document.document_type] || '📄'}
                </div>
                
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900">
                    {documentTypeLabels[document.document_type] || document.document_type}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {document.file_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Uploaded: {new Date(document.upload_date).toLocaleDateString()} • 
                    Size: {formatFileSize(document.file_size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <span className={`status-badge ${
                    document.is_verified ? 'status-completed' : 'status-pending'
                  }`}>
                    {document.is_verified ? '✅ Verified' : '⏳ Pending'}
                  </span>
                </div>

                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => openDocument(document.file_url)}
                    className="btn-secondary-modern text-sm"
                  >
                    👁️ View
                  </button>
                  
                  {canVerify && !document.is_verified && (
                    <button
                      onClick={() => verifyDocument(document.id)}
                      className="btn-primary-modern text-sm"
                    >
                      ✅ Verify
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentList;
