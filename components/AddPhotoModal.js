'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Upload, Loader2, ImagePlus, Camera, FolderOpen, RotateCcw } from 'lucide-react';
import { addPhoto } from '../lib/apiService';

const MATERIALS = ['Flex','Vinyl','LED / Digital','Hoarding','Neon Sign','Unipole','Gantry','Other'];

export default function AddPhotoModal({ projectId, onClose, onAdded }) {
  const galleryRef = useRef(null);
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);

  const [file, setFile]               = useState(null);
  const [preview, setPreview]         = useState(null);
  const [specs, setSpecs]             = useState({ length:'', breadth:'', height:'', location:'', material:'', notes:'' });
  const [progress, setProgress]       = useState(0);
  const [uploading, setUploading]     = useState(false);
  const [error, setError]             = useState('');
  const [cameraOpen, setCameraOpen]   = useState(false);
  const [facingMode, setFacingMode]   = useState('environment');
  const [cameraError, setCameraError] = useState('');

  const set = (k) => (e) => setSpecs((s) => ({ ...s, [k]: e.target.value }));

  const onGalleryFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const startCamera = useCallback(async (facing) => {
    setCameraError('');
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
    } catch {
      setCameraError('Camera access denied. Use "Choose File" instead.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (cameraOpen) startCamera(facingMode);
    else stopCamera();
    return stopCamera;
  }, [cameraOpen]);

  const flipCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  const capturePhoto = () => {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const f = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setCameraOpen(false);
    }, 'image/jpeg', 0.92);
  };

  const handleSave = async () => {
    if (!file)                  return setError('Please select or take a photo.');
    if (!specs.location.trim()) return setError('Location is required.');
    setError('');
    setUploading(true);
    try {
      await addPhoto(projectId, specs, file, setProgress);
      onAdded();
    } catch {
      setError('Upload failed. Check your AWS S3 credentials.');
    } finally {
      setUploading(false);
    }
  };

  // ── Camera fullscreen ─────────────────────────────────────────
  if (cameraOpen) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 bg-black/70 backdrop-blur safe-top">
          <button onClick={() => setCameraOpen(false)} className="p-2.5 bg-white/10 rounded-xl text-white active:bg-white/20">
            <X size={20} />
          </button>
          <span className="text-white font-bold text-sm">Take Photo</span>
          <button onClick={flipCamera} className="p-2.5 bg-white/10 rounded-xl text-white active:bg-white/20">
            <RotateCcw size={18} />
          </button>
        </div>

        <div className="flex-1 relative overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />

          {/* Corner guide */}
          {!cameraError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-56 relative opacity-50">
                {['tl','tr','bl','br'].map((c) => (
                  <div key={c} className={`absolute w-7 h-7 border-2 border-white
                    ${c === 'tl' ? 'top-0 left-0 border-r-0 border-b-0 rounded-tl-lg' : ''}
                    ${c === 'tr' ? 'top-0 right-0 border-l-0 border-b-0 rounded-tr-lg' : ''}
                    ${c === 'bl' ? 'bottom-0 left-0 border-r-0 border-t-0 rounded-bl-lg' : ''}
                    ${c === 'br' ? 'bottom-0 right-0 border-l-0 border-t-0 rounded-br-lg' : ''}`} />
                ))}
              </div>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6">
              <div className="bg-white rounded-3xl p-6 text-center max-w-xs">
                <Camera size={36} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-4">{cameraError}</p>
                <button onClick={() => setCameraOpen(false)}
                  className="text-primary-500 font-bold text-sm">Go back</button>
              </div>
            </div>
          )}
        </div>

        {!cameraError && (
          <div className="flex items-center justify-center py-8 bg-black/70 backdrop-blur"
            style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}>
            <button onClick={capturePhoto}
              className="active:scale-90 transition-transform"
              style={{ width: 76, height: 76 }}>
              <div className="w-full h-full rounded-full border-4 border-white/50 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white" />
              </div>
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Main modal (bottom sheet on mobile, centered on desktop) ──
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex flex-col sm:items-center sm:justify-center sm:p-4"
      onClick={onClose}>
      <div className="mt-auto sm:mt-0 bg-white w-full sm:max-w-2xl sm:rounded-3xl overflow-hidden shadow-2xl"
        style={{ maxHeight: '94vh' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Add Photo & Specs</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(94vh - 110px)' }}>
          <div className="p-5 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 text-sm font-medium">{error}</div>
            )}

            {/* Photo picker */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2.5">Photo *</label>
              <input ref={galleryRef} type="file" accept="image/*" onChange={onGalleryFile} className="hidden" />

              {preview ? (
                <div className="relative rounded-2xl overflow-hidden group">
                  <img src={preview} alt="preview" className="w-full h-52 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button onClick={() => setCameraOpen(true)}
                      className="flex items-center gap-1.5 bg-white/20 backdrop-blur text-white px-4 py-2 rounded-xl text-sm font-semibold active:bg-white/30">
                      <Camera size={14} /> Retake
                    </button>
                    <button onClick={() => galleryRef.current?.click()}
                      className="flex items-center gap-1.5 bg-white/20 backdrop-blur text-white px-4 py-2 rounded-xl text-sm font-semibold active:bg-white/30">
                      <ImagePlus size={14} /> Replace
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setCameraOpen(true)}
                    className="h-32 bg-primary-50 border-2 border-dashed border-primary-200 rounded-2xl flex flex-col items-center justify-center gap-2 active:bg-primary-100 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center shadow-md shadow-red-100">
                      <Camera size={18} className="text-white" />
                    </div>
                    <p className="text-sm font-bold text-primary-600">Take Photo</p>
                  </button>
                  <button onClick={() => galleryRef.current?.click()}
                    className="h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 active:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <FolderOpen size={18} className="text-gray-500" />
                    </div>
                    <p className="text-sm font-bold text-gray-500">Choose File</p>
                  </button>
                </div>
              )}
            </div>

            {/* Location */}
            <FormField label="Location *">
              <input value={specs.location} onChange={set('location')}
                placeholder="Full address or landmark"
                className="input-field" />
            </FormField>

            {/* Dimensions */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2.5">Dimensions (L × B × H)</label>
              <div className="grid grid-cols-3 gap-2">
                {[['length','Length'],['breadth','Breadth'],['height','Height']].map(([k, lbl]) => (
                  <div key={k}>
                    <p className="text-xs text-gray-500 mb-1 text-center">{lbl}</p>
                    <input value={specs[k]} onChange={set(k)} placeholder="10 ft"
                      className="input-field text-center text-sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Material */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2.5">Material / Type</label>
              <div className="flex flex-wrap gap-2">
                {MATERIALS.map((m) => (
                  <button key={m} type="button"
                    onClick={() => setSpecs((s) => ({ ...s, material: s.material === m ? '' : m }))}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                      specs.material === m
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white text-gray-600 border-gray-200 active:border-primary-300'
                    }`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <FormField label="Notes">
              <textarea value={specs.notes} onChange={set('notes')} rows={3}
                placeholder="Any additional notes…"
                className="input-field resize-none" />
            </FormField>

            {/* Progress */}
            {uploading && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span className="font-medium">Uploading to S3…</span>
                  <span className="font-bold text-primary-500">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky action bar */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3 bg-white"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          <button onClick={onClose} disabled={uploading}
            className="flex-1 py-3.5 border border-gray-200 text-gray-600 font-bold rounded-2xl active:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={uploading}
            className="flex-2 flex-[2] py-3.5 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 disabled:opacity-70 text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-100">
            {uploading
              ? <><Loader2 size={16} className="animate-spin" /> Uploading…</>
              : <><Upload size={16} /> Save Photo</>}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .input-field {
          width: 100%; padding: 0.75rem 1rem;
          border: 1.5px solid #e5e7eb; border-radius: 0.875rem;
          font-size: 1rem; color: #111827;
          outline: none; background: #f9fafb;
          transition: border-color 0.15s, box-shadow 0.15s;
          -webkit-appearance: none;
        }
        .input-field:focus {
          border-color: #CC0000;
          box-shadow: 0 0 0 3px rgba(204,0,0,0.1);
          background: white;
        }
      `}</style>
    </div>
  );
}

const FormField = ({ label, children }) => (
  <div>
    <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
    {children}
  </div>
);
