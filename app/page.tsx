"use client";

import { useState, useEffect, useRef } from 'react';
import { detectGCP, CoordsXY, GCPDetectorConfig, defaultConfig } from './utils/gcp_detector';

interface TooltipProps {
  content: string;
}

const InfoTooltip: React.FC<TooltipProps> = ({ content }) => (
  <div className="group relative inline-block ml-2">
    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a 1 1 0 100-2v-3a 1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-black text-white text-xs rounded shadow-lg z-50">
      {content}
    </div>
  </div>
);

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [detectedPoint, setDetectedPoint] = useState<CoordsXY[]>([]);
  const [cvReady, setCvReady] = useState(false);
  const [originalImageSize, setOriginalImageSize] = useState<{ width: number; height: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<GCPDetectorConfig>(defaultConfig);
  const imageRef = useRef<HTMLImageElement>(null);
  const [displayedImageSize, setDisplayedImageSize] = useState<{ width: number; height: number } | null>(null);

  const tooltips = {
    whiteThreshold: "Adjusts how bright a white marker needs to be to be detected. Higher values mean stricter white detection.",
    blackThreshold: "Controls how dark surrounding areas need to be. Lower values mean stricter black detection.",
    minMarkerArea: "The minimum size a marker needs to be for detection. Increase for clearer images, decrease for distant markers.",
    maxAreaDifference: "How different two markers can be in size and still be considered a pair.",
    pairDistance: "Maximum distance between two markers to be considered a pair. Adjust based on marker spacing in your images.",
    blackPixels: "How many dark pixels need to be around markers for verification. Higher values mean stricter checking."
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
  };

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
    if (!originalImageSize || !displayedImageSize) return point;
    
    // Calculate scale factors based on actual displayed image size
    const scaleX = displayedImageSize.width / originalImageSize.width;
    const scaleY = displayedImageSize.height / originalImageSize.height;
    
    return {
      x: point.x * scaleX,
      y: point.y * scaleY
    };
  };

  const updateDisplayedImageSize = () => {
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      setDisplayedImageSize({
        width: rect.width,
        height: rect.height
      });
    }
  };

  useEffect(() => {
    if (!imageRef.current) return;
    
    const observer = new ResizeObserver(updateDisplayedImageSize);
    observer.observe(imageRef.current);
    
    return () => observer.disconnect();
  }, []);

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

      const points = await detectGCP(img, config);
      if (points) {
        setDetectedPoint(points);
      }

      if (!points || points.length === 0) {
        setError('No GCP markers detected in the image. Please try with a different image.');
      }
    } catch (error) {
      console.error('Error detecting GCP:', error);
      setError('Failed to process image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getImageContainerStyle = () => {
    if (!originalImageSize) return {};
    
    // Set container to exact image dimensions, but with max constraints
    const maxWidth = Math.min(800, originalImageSize.width);
    const scale = maxWidth / originalImageSize.width;
    const width = maxWidth;
    const height = originalImageSize.height * scale;
    
    return {
      position: 'relative' as const,
      width: `${width}px`,
      height: `${height}px`,
      margin: '0 auto',
    };
  };

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-400">GCP Detector</h1>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 border-l-4 border-red-500 bg-gray-800 rounded">
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

        {/* Main Content */}
        <div className="space-y-6">
          {/* Image Viewer Section */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden border border-gray-700 mx-auto" style={{ maxWidth: '800px' }}>
            {preview ? (
              <div style={getImageContainerStyle()}>
                <img
                  ref={imageRef}
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    const newSize = {
                      width: img.naturalWidth,
                      height: img.naturalHeight
                    };
                    setOriginalImageSize(newSize);
                    setDisplayedImageSize({
                      width: Math.min(800, img.naturalWidth),
                      height: Math.min(800 * (img.naturalHeight / img.naturalWidth), img.naturalHeight)
                    });
                  }}
                />
                {detectedPoint.length > 0 && detectedPoint.map((point, index) => {
                  const scaledPoint = scaleCoordinates(point);
                  return (
                    <div key={index} className="absolute top-0 left-0 w-full h-full pointer-events-none">
                      <div
                        className="absolute w-6 h-6 border-2 border-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                        style={{
                          left: `${scaledPoint.x}px`,
                          top: `${scaledPoint.y}px`,
                        }}
                      >
                        <div 
                          className="absolute w-2 h-2 bg-red-500 rounded-full"
                          style={{
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)'
                          }}
                        />
                      </div>
                      <div
                        className="absolute px-2 py-1 bg-black/75 text-white text-xs rounded"
                        style={{
                          left: `${scaledPoint.x + 15}px`,
                          top: `${scaledPoint.y + 15}px`,
                        }}
                      >
                        {index + 1}: ({point.x.toFixed(1)}, {point.y.toFixed(1)})
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="w-full h-[400px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>No image selected</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Section */}
            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
              <label className="block text-gray-300 text-sm font-medium mb-4">
                Upload Image
                <span className="text-gray-500 ml-2">(Max size: 10MB)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-gray-600 file:text-gray-300 hover:file:bg-gray-500"
              />
              <button
                onClick={handleDetectGCP}
                disabled={!selectedImage || loading || !cvReady}
                className={`w-full mt-4 py-3 px-4 rounded-lg font-medium transition-colors
                  ${!selectedImage || loading || !cvReady
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
              >
                {loading ? 'Processing...' : 'Detect GCP'}
              </button>
            </div>

            {/* Configuration Section */}
            <div className="lg:col-span-2 p-6 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-blue-400">Detection Settings</h3>
                <button
                  onClick={resetConfig}
                  className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                >
                  Reset to Defaults
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* White Marker Settings */}
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center text-gray-300 mb-2">
                      White Marker Brightness
                      <InfoTooltip content={tooltips.whiteThreshold} />
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="200"
                      value={config.whiteThreshold.min[2]}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        whiteThreshold: {
                          ...prev.whiteThreshold,
                          min: [0, 0, parseInt(e.target.value)]
                        }
                      }))}
                      className="w-full accent-blue-500"
                    />
                  </div>
                  <div>
                    <label className="flex items-center text-gray-300 mb-2">
                      Background Darkness
                      <InfoTooltip content={tooltips.blackThreshold} />
                    </label>
                    <input
                      type="range"
                      min="80"
                      max="180"
                      value={config.blackThreshold.max[2]}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        blackThreshold: {
                          ...prev.blackThreshold,
                          max: [180, 255, parseInt(e.target.value)]
                        }
                      }))}
                      className="w-full accent-blue-500"
                    />
                  </div>
                  <div>
                    <label className="flex items-center text-gray-300 mb-2">
                      Minimum Marker Size
                      <InfoTooltip content={tooltips.minMarkerArea} />
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="500"
                      value={config.minMarkerArea}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        minMarkerArea: parseInt(e.target.value)
                      }))}
                      className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-gray-300"
                    />
                  </div>
                </div>

                {/* Black Detection Settings */}
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center text-gray-300 mb-2">
                      Maximum Marker Pair Distance
                      <InfoTooltip content={tooltips.pairDistance} />
                    </label>
                    <input
                      type="number"
                      min="30"
                      max="200"
                      value={config.pairCriteria.maxDistance}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        pairCriteria: {
                          ...prev.pairCriteria,
                          maxDistance: parseInt(e.target.value)
                        }
                      }))}
                      className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-gray-300"
                    />
                  </div>
                  <div>
                    <label className="flex items-center text-gray-300 mb-2">
                      Verification Strictness
                      <InfoTooltip content={tooltips.blackPixels} />
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={config.minBlackPixels}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        minBlackPixels: parseInt(e.target.value)
                      }))}
                      className="w-full accent-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {detectedPoint.length > 0 && (
            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="text-lg font-medium text-blue-400 mb-4">Detected Coordinates</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {detectedPoint.map((point, index) => (
                  <div key={index} className="p-3 bg-gray-700 rounded-md">
                    <div className="text-sm text-gray-400">Point {index + 1}</div>
                    <div className="font-mono text-sm">
                      X: {point.x.toFixed(1)}
                      <br />
                      Y: {point.y.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
