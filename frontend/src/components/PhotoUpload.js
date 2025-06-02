import React, { useState } from 'react';

const PhotoUpload = ({ 
  onPhotoSelect, 
  multiple = false, 
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB
  preview = true,
  label = "Upload Photo",
  existingPhotos = []
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setError('');

    // Validate files
    const validFiles = [];
    const newPreviewUrls = [...previewUrls];

    for (const file of files) {
      // Check file size
      if (file.size > maxSize) {
        setError(`File ${file.name} is too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
        continue;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError(`File ${file.name} is not an image`);
        continue;
      }

      validFiles.push(file);
      
      // Create preview URL
      if (preview) {
        const previewUrl = URL.createObjectURL(file);
        newPreviewUrls.push(previewUrl);
      }
    }

    if (validFiles.length > 0) {
      setSelectedFiles(multiple ? [...selectedFiles, ...validFiles] : validFiles);
      setPreviewUrls(newPreviewUrls);
      
      // Call parent callback
      if (onPhotoSelect) {
        onPhotoSelect(multiple ? [...selectedFiles, ...validFiles] : validFiles);
      }
    }
  };

  const removePhoto = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);
    
    if (onPhotoSelect) {
      onPhotoSelect(newFiles);
    }
  };

  return (
    <div className="photo-upload-container">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-8 h-8 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, JPEG up to {maxSize / (1024 * 1024)}MB
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              accept={accept}
              multiple={multiple}
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>
        </div>

        {error && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
            {error}
          </div>
        )}
      </div>

      {/* Photo Previews */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            📸 {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;