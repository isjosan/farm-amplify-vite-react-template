import React, { useRef, useState, useEffect } from 'react';

// Define the type for the App component (it takes no props)
const App: React.FC = () => {
  // Refs for the video stream and the canvas used for image capture.
  // We explicitly type the refs to HTMLVideoElement and HTMLCanvasElement, respectively.
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State to manage UI messages, stream status, and error handling.
  // Explicitly type the state variables.
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("Click 'Start Camera' to begin.");
  const [error, setError] = useState<string | null>(null);

  // Clean up the camera stream when the component unmounts.
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  /**
   * Initializes and starts the camera stream.
   */
  const startCamera = async (): Promise<void> => {
    setError(null);
    setMessage("Attempting to access camera...");

    try {
      // Request access to the user's video camera
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Attach the stream to the video element
      if (videoRef.current) {
        // TypeScript ensures videoRef.current is an HTMLVideoElement here
        videoRef.current.srcObject = newStream;
        await videoRef.current.play(); // Play the video stream
      }

      setStream(newStream);
      setIsCameraActive(true);
      setMessage("Camera active. Say cheese!");

    } catch (err) {
      // Use 'unknown' for the caught error and provide a user-friendly message
      console.error("Error accessing camera:", err);
      setError("Camera access denied or unavailable. Please check permissions or try again.");
      setMessage("Camera failed to start.");
      setIsCameraActive(false);
    }
  };

  /**
   * Stops the active camera stream.
   */
  const stopCamera = (): void => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      if (videoRef.current) {
         videoRef.current.srcObject = null;
      }
      setStream(null);
      setIsCameraActive(false);
      setMessage("Camera stopped. Click 'Start Camera' to restart.");
      setError(null);
    }
  };

  /**
   * Captures the current frame from the video and saves it locally.
   */
  const takeSnapshot = (): void => {
    // Check if refs and camera are active
    if (!isCameraActive || !videoRef.current || !canvasRef.current) {
      setError("Camera is not active or references are missing.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions to match the video element's natural size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    if (canvas.width === 0 || canvas.height === 0) {
        setError("Video stream is not ready or has zero dimensions.");
        return;
    }

    // Draw the current video frame onto the canvas
    const context = canvas.getContext('2d');
    
    // Safety check for context
    if (!context) {
      setError("Could not get 2D rendering context from canvas.");
      return;
    }
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert the canvas content to a JPEG data URL
    const imageURL: string = canvas.toDataURL('image/jpeg', 0.9);

    downloadImage(imageURL);
    setMessage("Snapshot captured and downloaded successfully!");
  };

  /**
   * Triggers the download of the image data URL.
   * The function now explicitly types the dataUrl parameter as a string.
   */
  const downloadImage = (dataUrl: string): void => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `snapshot-${new Date().toISOString().slice(0, 10)}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 font-inter">
      <div className="w-full max-w-2xl bg-white shadow-2xl rounded-xl p-6 md:p-8">
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Webcam Photo Snapshot
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

        {/* Video Preview Area */}
        <div className="relative w-full aspect-video bg-gray-800 rounded-xl overflow-hidden shadow-inner mb-6">
          <video
            ref={videoRef}
            className={`w-full h-full object-cover transition-opacity duration-500 ${isCameraActive ? 'opacity-100' : 'opacity-0'}`}
            autoPlay
            muted
            playsInline
          ></video>
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

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          
          {/* Start/Stop Camera Button */}
          <button
            onClick={isCameraActive ? stopCamera : startCamera}
            className={`
              flex-1 py-3 px-6 rounded-lg font-semibold text-lg transition duration-300 transform hover:scale-[1.02] shadow-lg
              ${isCameraActive 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-300/50' 
                : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-300/50'
              }
            `}
          >
            {isCameraActive ? 'Stop Camera' : 'Start Camera'}
          </button>

          {/* Take Snapshot Button */}
          <button
            onClick={takeSnapshot}
            disabled={!isCameraActive}
            className={`
              flex-1 py-3 px-6 rounded-lg font-semibold text-lg transition duration-300 transform hover:scale-[1.02] shadow-lg
              ${isCameraActive 
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-300/50' 
                : 'bg-gray-400 text-gray-700 cursor-not-allowed'
              }
            `}
          >
            Take Snapshot (JPG)
          </button>
        </div>

        {/* Hidden Canvas - Used only for image processing */}
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    </div>
  );
};

export default App;
