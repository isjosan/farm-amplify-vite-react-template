import React, { useRef, useState, useEffect } from 'react';
// Import the component from the UI storage package
import { FileUploader } from '@aws-amplify/ui-react-storage';
// Use the core package path, which currently contains the deprecated type definition
import { StorageAccessLevel } from '@aws-amplify/core'; 
import '@aws-amplify/ui-react/styles.css';

// --- Helper Function for Local Download ---

/**
 * Triggers the download of the image data URL.
 */
const downloadImage = (dataUrl: string): void => {
    const link = document.createElement('a');
    link.href = dataUrl;
    // Creates a unique, time-stamped filename
    link.download = `snapshot-${new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


// --- Main Integrated App Component ---

const App: React.FC = () => {
  // Camera Refs and State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  
  // Shared State for Status Messages
  const [message, setMessage] = useState<string>("Click 'Start Camera' to capture, then upload below.");
  const [error, setError] = useState<string | null>(null);

  // FIX: Use a type assertion to satisfy TypeScript that 'public' matches the 
  // imported (though deprecated) StorageAccessLevel type.
  const accessLevel: StorageAccessLevel = 'public' as StorageAccessLevel; 

  // --- Camera Lifecycle and Control Functions ---

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async (): Promise<void> => {
    setError(null);
    setMessage("Attempting to access camera...");

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }
      setStream(newStream);
      setIsCameraActive(true);
      setMessage("Camera active. Click 'Take Snapshot & Download'.");
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Camera access denied or unavailable. Please check permissions.");
      setMessage("Camera failed to start.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = (): void => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      if (videoRef.current) {
         videoRef.current.srcObject = null;
      }
      setStream(null);
      setIsCameraActive(false);
      setMessage("Camera stopped. Now upload your downloaded file in section 2.");
      setError(null);
    }
  };

  /**
   * Captures the current frame, converts it to JPEG, and triggers a local download.
   */
  const takeSnapshot = (): void => {
    if (!isCameraActive || !videoRef.current || !canvasRef.current) {
      setError("Camera is not active or references are missing.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    if (canvas.width === 0 || canvas.height === 0) {
        setError("Video stream is not ready or has zero dimensions.");
        return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      setError("Could not get 2D rendering context from canvas.");
      return;
    }
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageURL: string = canvas.toDataURL('image/jpeg', 0.9);
    downloadImage(imageURL); 

    setMessage("Snapshot captured and downloaded! Now, upload the file using the Uploader below.");
    setError(null);
  };
  
  // --- UI Rendering ---

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 font-inter">
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-xl p-6 md:p-8">
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Camera Capture & Amplify Upload
        </h1>

        {/* Status Message Area */}
        <div className={`text-center py-3 px-4 rounded-lg mb-6 ${error ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}>
          <p className="font-medium">{message}</p>
        </div>
        
        {/* Error Display */}
        {error && (
            <div className="bg-red-500 text-white p-3 rounded-lg text-center mb-6">
                <p className="font-semibold">{error}</p>
            </div>
        )}

        {/* Use a grid to organize the two main sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* --- Left Column: Camera Capture & Download --- */}
            <div className="flex flex-col">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Capture & Download Photo</h2>
                <div className="relative w-full aspect-video bg-gray-800 rounded-xl overflow-hidden shadow-inner mb-4">
                  <video
                    ref={videoRef}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${isCameraActive ? 'opacity-100' : 'opacity-0'}`}
                    autoPlay
                    muted
                    playsInline
                  ></video>
                   {/* Placeholder when camera is inactive */}
                   {!isCameraActive && (
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gray-900/80">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.218A2 2 0 0110.198 4h3.604a2 2 0 011.664.89l.812 1.218A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                           <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                         </svg>
                         <p className="text-lg font-semibold">Camera Preview</p>
                       </div>
                   )}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={isCameraActive ? stopCamera : startCamera}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition duration-300 shadow-md ${isCameraActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
                  >
                    {isCameraActive ? 'Stop Camera' : 'Start Camera'}
                  </button>

                  <button
                    onClick={takeSnapshot}
                    disabled={!isCameraActive}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition duration-300 shadow-md ${isCameraActive ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-400 text-gray-700 cursor-not-allowed'}`}
                  >
                    Take Snapshot & Download
                  </button>
                </div>
            </div>

            {/* --- Right Column: Amplify File Uploader --- */}
            <div className="flex flex-col">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Select File to Upload to Storage</h2>
                <FileUploader
                  acceptedFileTypes={['image/*']}
                  path="picture-submissions/" 
                  maxFileCount={1}
                  isResumable
                  accessLevel={accessLevel} 
                  
                  // Corrected prop name for success callback
                  onUploadSuccess={(object) => {
                      setMessage(`File "${object.key}" uploaded successfully to Amplify Storage!`);
                      setError(null);
                  }}
                  // Corrected prop name for error callback
                  onUploadError={(e) => {
                      setError("File upload failed. Check the console for details.");
                      console.error("FileUploader Error:", e);
                  }}
                />
            </div>
        </div>

        {/* Hidden Canvas - Used only for image processing */}
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    </div>
  );
};

export default App;

