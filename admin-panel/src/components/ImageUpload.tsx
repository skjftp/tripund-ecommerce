import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
}

export default function ImageUpload({
  images,
  onImagesChange,
  maxImages = 10,
  label = 'Product Images'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    for (let i = 0; i < files.length && images.length + newImages.length < maxImages; i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum size is 5MB`);
        continue;
      }

      try {
        // Upload to GCS via backend API
        const formData = new FormData();
        formData.append('image', file);
        formData.append('type', 'categories');

        const token = localStorage.getItem('adminToken');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/upload/image`, {
          method: 'POST',
          headers,
          body: formData
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Upload error response:', errorText);
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Upload result:', result);
        
        // Try CDN URL first, but test if it loads, otherwise use GCS URL
        const cdnUrl = result.cdn_url;
        const gcsUrl = result.url;
        
        let imageUrl = gcsUrl; // Default to GCS URL which should always work
        
        // Test if CDN URL is available (with timeout)
        if (cdnUrl) {
          try {
            const testResponse = await Promise.race([
              fetch(cdnUrl, { method: 'HEAD' }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('CDN timeout')), 3000)
              )
            ]) as Response;
            
            if (testResponse.ok) {
              imageUrl = cdnUrl;
              console.log('Using CDN URL:', cdnUrl);
            } else {
              console.log('CDN not available, using GCS URL:', gcsUrl);
            }
          } catch (cdnError) {
            console.log('CDN test failed, using GCS URL:', gcsUrl);
          }
        }
        
        newImages.push(imageUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert(`Failed to upload ${file.name}`);
      }
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }
    
    setUploading(false);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Create a fake event to reuse handleFileSelect logic
      const fakeEvent = {
        target: { files }
      } as React.ChangeEvent<HTMLInputElement>;
      await handleFileSelect(fakeEvent);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />
        
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {uploading ? 'Uploading...' : 'Click or drag images to upload'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          PNG, JPG, GIF up to 5MB • Max {maxImages} images
        </p>
        {images.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {images.length} of {maxImages} images uploaded
          </p>
        )}
        
        {/* Add explicit button for better UX */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
          disabled={uploading || images.length >= maxImages}
          className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Select Images
        </button>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                {image ? (
                  <img
                    src={image}
                    alt={`Product ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Image load error for URL:', image);
                      const target = e.target as HTMLImageElement;
                      // If CDN URL fails and we haven't already tried GCS, try GCS URL
                      if (image.includes('images.tripundlifestyle.com') && !target.dataset.retried) {
                        const gcsUrl = image.replace('https://images.tripundlifestyle.com/', 'https://storage.googleapis.com/tripund-product-images/');
                        console.log('Retrying with GCS URL:', gcsUrl);
                        target.src = gcsUrl;
                        target.dataset.retried = 'true';
                      }
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', image);
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(index);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                type="button"
              >
                <X size={16} />
              </button>
              
              {/* Primary image badge */}
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}