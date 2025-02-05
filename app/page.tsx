"use client";

import { useState, useEffect, useRef } from 'react';
import { detectGCP, CoordsXY } from './utils/gcp_detector';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [detectedPoint, setDetectedPoint] = useState<CoordsXY | null>(null);
  const [cvReady, setCvReady] = useState(false);
  const [originalImageSize, setOriginalImageSize] = useState<{ width: number; height: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/opencv.js';
    console.log('Loading OpenCV...');
    script.async = true;
    script.onload = () => {
      console.log('OpenCV loaded');
      setCvReady(true);
      setError(null);
    };
    script.onerror = () => {
      setError('Failed to load OpenCV. Please refresh the page.');
    };
    document.body.appendChild(script);
    console.log('OpenCV script added to body');
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setLoading(true);
    const file = event.target.files?.[0];

    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Image size should be less than 10MB');
        setLoading(false);
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const scaleCoordinates = (point: CoordsXY): CoordsXY => {
    if (!originalImageSize || !imageRef.current) return point;
    
    // Get the display dimensions
    const displayWidth = imageRef.current.clientWidth;
    const displayHeight = imageRef.current.clientHeight;
    
    // Calculate aspect ratios
    const imageAspectRatio = originalImageSize.width / originalImageSize.height;
    const containerAspectRatio = displayWidth / displayHeight;
    
    let scale = { x: 1, y: 1 };
    
    // Determine scaling based on aspect ratio
    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider than container
      scale.x = displayWidth / originalImageSize.width;
      scale.y = scale.x; // Maintain aspect ratio
    } else {
      // Image is taller than container
      scale.y = displayHeight / originalImageSize.height;
      scale.x = scale.y; // Maintain aspect ratio
    }
    
    // Calculate the actual dimensions after scaling
    const scaledWidth = originalImageSize.width * scale.x;
    const scaledHeight = originalImageSize.height * scale.y;
    
    // Calculate offsets to center the image
    const offsetX = (displayWidth - scaledWidth) / 2;
    const offsetY = (displayHeight - scaledHeight) / 2;
    
    return {
      x: (point.x * scale.x) + offsetX,
      y: (point.y * scale.y) + offsetY
    };
  };

  const handleDetectGCP = async () => {
    if (!selectedImage || !cvReady) return;

    setLoading(true);
    setError(null);
    try {
      const img = new Image();
      img.src = preview as string;
      await new Promise((resolve) => {
        img.onload = () => {
          setOriginalImageSize({ width: img.width, height: img.height });
          resolve(null);
        };
      });

      const point = await detectGCP(img);
      setDetectedPoint(point);

      if (!point) {
        setError('No GCP marker detected in the image. Please try with a different image.');
      }
    } catch (error) {
      console.error('Error detecting GCP:', error);
      setError('Failed to process image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-100">
      <div className="w-full max-w-4xl p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-4xl font-bold mb-6 text-center">GCP Detector</h1>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 border-l-4 border-red-500 bg-red-50 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm leading-5 font-medium text-red-800">
                  Error
                </h3>
                <div className="mt-1 text-sm leading-5 text-red-700">
                  {error}
                </div>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setError(null)}
                    className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Upload Image
                <span className="text-gray-500 font-normal ml-2">(Max size: 10MB)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full p-2 border rounded"
              />
            </div>

            {detectedPoint && (
              <div className="p-4 border rounded-lg bg-gray-50">
                <h3 className="font-bold mb-2">Detected Coordinates</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-600">Original X:</span>
                    <span className="ml-2 font-mono">{detectedPoint.x.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Original Y:</span>
                    <span className="ml-2 font-mono">{detectedPoint.y.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleDetectGCP}
              disabled={!selectedImage || loading || !cvReady}
              className={`w-full py-3 px-4 rounded-lg font-bold
                ${!selectedImage || loading || !cvReady
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
            >
              {loading ? 'Processing...' : 'Detect GCP'}
            </button>
          </div>

          <div className="relative border rounded-lg overflow-hidden bg-gray-50">
            {preview ? (
              <>
                <img
                  ref={imageRef}
                  src={preview}
                  alt="Preview"
                  className="max-w-full h-auto object-contain"
                  style={{ maxHeight: '600px', width: '100%' }}
                  onLoad={(e) => {
                    // Update image size on load
                    const img = e.currentTarget;
                    setOriginalImageSize({
                      width: img.naturalWidth,
                      height: img.naturalHeight
                    });
                  }}
                />
                {detectedPoint && (
                  <>
                    <div
                      className="absolute w-6 h-6 border-2 border-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                      style={{
                        left: `${scaleCoordinates(detectedPoint).x}px`,
                        top: `${scaleCoordinates(detectedPoint).y}px`,
                        pointerEvents: 'none' // Prevent marker from interfering with interactions
                      }}
                    >
                      <div className="absolute inset-0 m-auto w-2 h-2 bg-red-500 rounded-full" />
                    </div>
                    <div
                      className="absolute px-2 py-1 bg-black/75 text-white text-xs rounded"
                      style={{
                        left: `${scaleCoordinates(detectedPoint).x + 15}px`,
                        top: `${scaleCoordinates(detectedPoint).y + 15}px`,
                        pointerEvents: 'none',
                        transform: 'translate(0, 0)' // Remove default transform
                      }}
                    >
                      ({detectedPoint.x.toFixed(1)}, {detectedPoint.y.toFixed(1)})
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                No image selected
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
