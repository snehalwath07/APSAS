import React, { useState, useRef } from 'react';

const CameraUpload = ({ onCapture }) => {
  const [streamActive, setStreamActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      setPreviewUrl(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStreamActive(true);
    } catch (err) {
      console.error('Webcam initialization failed:', err);
      alert('Could not access camera. Please upload an image instead.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions equal to video feed
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const file = new File([blob], 'captured_evidence.jpg', { type: 'image/jpeg' });
      setPreviewUrl(URL.createObjectURL(blob));
      onCapture(file);
      stopCamera();
    }, 'image/jpeg');
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      onCapture(file);
    }
  };

  return (
    <div className="bg-slate-800/20 border border-border p-4 rounded-xl space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-text-dim uppercase tracking-wider">Evidence Capture</label>
        <div className="flex gap-2">
          {!streamActive && (
            <button
              type="button"
              onClick={startCamera}
              className="bg-indigo/20 text-indigo hover:bg-indigo hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold border border-indigo/40 transition"
            >
              📷 Open Camera
            </button>
          )}
          {streamActive && (
            <button
              type="button"
              onClick={stopCamera}
              className="bg-red/20 text-red hover:bg-red hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold border border-red/40 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="relative bg-slate-950/60 rounded-xl min-h-[160px] flex items-center justify-center border border-dashed border-border-strong overflow-hidden">
        {/* Real-time Video Stream */}
        {streamActive && (
          <div className="w-full h-full flex flex-col items-center">
            <video ref={videoRef} className="w-full max-h-[220px] object-cover" playsInline />
            <button
              type="button"
              onClick={capturePhoto}
              className="absolute bottom-4 bg-emerald hover:bg-emerald-600 text-white font-bold py-2 px-5 rounded-full shadow-lg text-xs tracking-wider uppercase transition"
            >
              📸 Capture Snapshot
            </button>
          </div>
        )}

        {/* Upload Preview */}
        {!streamActive && previewUrl && (
          <div className="w-full p-2 flex flex-col items-center">
            <img src={previewUrl} alt="Captured preview" className="max-h-[180px] rounded-lg object-contain" />
            <span className="text-[11px] text-emerald-400 font-semibold mt-1.5 flex items-center gap-1">✔ Evidence Attached</span>
          </div>
        )}

        {/* Drag & Drop Standard File Upload */}
        {!streamActive && !previewUrl && (
          <div className="p-4 text-center space-y-2">
            <p className="text-xs text-text-dim">No evidence selected. Capture a live photo or upload an image file.</p>
            <input
              type="file"
              accept="image/*"
              id="file-evidence-upload"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="file-evidence-upload"
              className="inline-block bg-slate-800 hover:bg-slate-700 text-text px-4 py-2 rounded-lg text-xs font-semibold border border-border cursor-pointer transition"
            >
              Browse File...
            </label>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraUpload;
