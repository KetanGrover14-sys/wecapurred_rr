'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Upload, Loader2, ImagePlus, Camera, FolderOpen, RotateCcw, MapPin, LocateFixed, Plus, Trash2, Undo2, Eraser, Check } from 'lucide-react';
import { addPhoto } from '../lib/apiService';

const MATERIALS = ['Non-Lit', 'GSB', 'GSB-D/S', 'VSB','Other'];

const blankEntry = () => ({ _id: Date.now() + Math.random(), material: '', length: '', breadth: '', height: '', notes: '' });

const PEN_COLORS = [
  { label: 'Red',    hex: '#CC0000' },
  { label: 'Black',  hex: '#000000' },
  { label: 'White',  hex: '#FFFFFF' },
  { label: 'Yellow', hex: '#FFD600' },
  { label: 'Blue',   hex: '#1565C0' },
  { label: 'Green',  hex: '#2E7D32' },
];
const PEN_SIZES = [3, 6, 12];

export default function AddPhotoModal({ projectId, onClose, onAdded }) {
  const galleryRef = useRef(null);
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);

  const [file, setFile]               = useState(null);
  const [preview, setPreview]         = useState(null);
  const [location, setLocation]       = useState('');
  const [entries, setEntries]         = useState([blankEntry()]);
  const [progress, setProgress]       = useState(0);
  const [uploading, setUploading]     = useState(false);
  const [error, setError]             = useState('');
  const [cameraOpen, setCameraOpen]   = useState(false);
  const [facingMode, setFacingMode]   = useState('environment');
  const [cameraError, setCameraError] = useState('');
  const [locLoading, setLocLoading]   = useState(false);
  const [locError, setLocError]       = useState('');

  // ── Annotation state ──────────────────────────────────────────
  const [annotating, setAnnotating]   = useState(false);
  const [rawFile, setRawFile]         = useState(null);
  const [rawPreview, setRawPreview]   = useState(null);
  const [penColor, setPenColor]       = useState('#CC0000');
  const [penSize, setPenSize]         = useState(6);
  const [canUndo, setCanUndo]         = useState(false);
  const annotateCanvasRef = useRef(null);
  const isDrawing     = useRef(false);
  const lastPos       = useRef(null);
  const penColorRef   = useRef('#CC0000');
  const penSizeRef    = useRef(6);
  const penPaths      = useRef([]); // [{points, color, size}]
  const baseImageData = useRef(null);

  // ── Entry helpers ─────────────────────────────────────────────
  const addEntry    = () => setEntries((e) => [...e, blankEntry()]);
  const removeEntry = (id) => setEntries((e) => e.filter((x) => x._id !== id));
  const setEntry    = (id) => (field) => (value) =>
    setEntries((e) => e.map((x) => x._id === id ? { ...x, [field]: value } : x));

  // ── Auto location ─────────────────────────────────────────────
  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocError('GPS not supported.'); return; }
    setLocLoading(true); setLocError('');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res  = await fetch(`/api/geocode?lat=${coords.latitude}&lon=${coords.longitude}`);
          const data = await res.json();
          const a    = data.address || {};
          const parts = [
            a.road || a.pedestrian || a.footway,
            a.suburb || a.neighbourhood || a.quarter,
            a.city || a.town || a.village || a.county,
            a.state,
          ].filter(Boolean);
          setLocation(parts.join(', ') || data.display_name || '');
        } catch { setLocError('Could not fetch address. Enter manually.'); }
        finally  { setLocLoading(false); }
      },
      (err) => {
        setLocLoading(false);
        setLocError(err.code === 1 ? 'Location permission denied.' : 'Could not get location.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => { fetchLocation(); }, []);

  // ── Open annotation after photo is chosen ─────────────────────
  const openAnnotation = (f, url) => {
    setRawFile(f);
    setRawPreview(url);
    penPaths.current = [];
    setCanUndo(false);
    setAnnotating(true);
  };

  // ── Gallery / Camera ──────────────────────────────────────────
  const onGalleryFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    openAnnotation(f, URL.createObjectURL(f));
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
    } catch { setCameraError('Camera access denied. Use "Choose File" instead.'); }
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
    setFacingMode(next); startCamera(next);
  };

  const capturePhoto = () => {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const f = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setCameraOpen(false);
      openAnnotation(f, URL.createObjectURL(f));
    }, 'image/jpeg', 0.92);
  };

  // ── Annotation canvas setup ───────────────────────────────────
  useEffect(() => {
    if (!annotating || !rawPreview) return;
    const canvas = annotateCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      baseImageData.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    };
    img.src = rawPreview;
  }, [annotating, rawPreview]);

  // ── Drawing helpers ───────────────────────────────────────────
  const getCanvasPos = (e) => {
    const canvas = annotateCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches?.[0] ?? e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    };
  };

  const redrawAll = useCallback(() => {
    const canvas = annotateCanvasRef.current;
    if (!canvas || !baseImageData.current) return;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(baseImageData.current, 0, 0);
    for (const path of penPaths.current) {
      if (path.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = path.color;
      ctx.lineWidth   = path.size;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
    }
  }, []);

  const handlePointerDown = (e) => {
    e.preventDefault();
    isDrawing.current = true;
    const pos = getCanvasPos(e);
    lastPos.current = pos;
    const ctx = annotateCanvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, penSizeRef.current / 2, 0, Math.PI * 2);
    ctx.fillStyle = penColorRef.current;
    ctx.fill();
    // start tracking this stroke
    penPaths.current = [...penPaths.current, { points: [pos], color: penColorRef.current, size: penSizeRef.current }];
  };

  const handlePointerMove = (e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const pos = getCanvasPos(e);
    const ctx = annotateCanvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = penColorRef.current;
    ctx.lineWidth   = penSizeRef.current;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();
    lastPos.current = pos;
    // append point to current stroke
    const paths = penPaths.current;
    const last = paths[paths.length - 1];
    penPaths.current = [...paths.slice(0, -1), { ...last, points: [...last.points, pos] }];
  };

  const handlePointerUp = (e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    isDrawing.current = false;
    setCanUndo(penPaths.current.length > 0);
  };

  const handleUndo = () => {
    penPaths.current = penPaths.current.slice(0, -1);
    redrawAll();
    setCanUndo(penPaths.current.length > 0);
  };

  const handleClear = () => {
    penPaths.current = [];
    redrawAll();
    setCanUndo(false);
  };

  const handleAnnotateDone = () => {
    const canvas = annotateCanvasRef.current;
    canvas.toBlob((blob) => {
      const annotatedFile = new File([blob], rawFile?.name || `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setFile(annotatedFile);
      setPreview(URL.createObjectURL(annotatedFile));
      setAnnotating(false);
    }, 'image/jpeg', 0.92);
  };

  const handleAnnotateSkip = () => {
    setFile(rawFile);
    setPreview(rawPreview);
    setAnnotating(false);
  };

  const selectPenColor = (hex) => {
    penColorRef.current = hex;
    setPenColor(hex);
  };
  const selectPenSize = (s) => {
    penSizeRef.current = s;
    setPenSize(s);
  };

  // ── Save ──────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!file)              return setError('Please select or take a photo.');
    if (!location.trim())   return setError('Location is required.');
    setError(''); setUploading(true);
    try {
      await addPhoto(projectId, location, entries, file, setProgress);
      onAdded();
    } catch { setError('Upload failed. Check your AWS S3 credentials.'); }
    finally  { setUploading(false); }
  };

  // ── Camera fullscreen ─────────────────────────────────────────
  if (cameraOpen) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 bg-black/70 backdrop-blur">
          <button onClick={() => setCameraOpen(false)} className="p-2.5 bg-white/10 rounded-xl text-white"><X size={20} /></button>
          <span className="text-white font-bold text-sm">Take Photo</span>
          <button onClick={flipCamera} className="p-2.5 bg-white/10 rounded-xl text-white"><RotateCcw size={18} /></button>
        </div>
        <div className="flex-1 relative overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          {!cameraError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-56 relative opacity-50">
                {[['top-0 left-0 border-r-0 border-b-0 rounded-tl-lg'],['top-0 right-0 border-l-0 border-b-0 rounded-tr-lg'],
                  ['bottom-0 left-0 border-r-0 border-t-0 rounded-bl-lg'],['bottom-0 right-0 border-l-0 border-t-0 rounded-br-lg']
                ].map(([cls], i) => (
                  <div key={i} className={`absolute w-7 h-7 border-2 border-white ${cls}`} />
                ))}
              </div>
            </div>
          )}
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6">
              <div className="bg-white rounded-3xl p-6 text-center max-w-xs">
                <Camera size={36} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-4">{cameraError}</p>
                <button onClick={() => setCameraOpen(false)} className="text-primary-500 font-bold text-sm">Go back</button>
              </div>
            </div>
          )}
        </div>
        {!cameraError && (
          <div className="flex items-center justify-center py-8 bg-black/70 backdrop-blur"
            style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}>
            <button onClick={capturePhoto} className="active:scale-90 transition-transform" style={{ width: 76, height: 76 }}>
              <div className="w-full h-full rounded-full border-4 border-white/50 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white" />
              </div>
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Annotation fullscreen ─────────────────────────────────────
  if (annotating) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur flex-shrink-0">
          <button onClick={handleAnnotateSkip} className="p-2.5 bg-white/10 rounded-xl text-white">
            <X size={20} />
          </button>
          <div className="text-center">
            <p className="text-white font-bold text-sm">Annotate Photo</p>
            <p className="text-white/60 text-xs">Draw on the image, then tap Done</p>
          </div>
          <button
            onClick={handleAnnotateDone}
            className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors"
          >
            <Check size={16} /> Done
          </button>
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-hidden flex items-center justify-center bg-black">
          <canvas
            ref={annotateCanvasRef}
            className="max-w-full max-h-full object-contain touch-none cursor-crosshair"
            style={{ display: 'block' }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />
        </div>

        {/* Toolbar */}
        <div className="bg-gray-900 px-4 py-3 flex-shrink-0 space-y-3"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          {/* Color swatches */}
          <div className="flex items-center justify-center gap-3">
            {PEN_COLORS.map(({ label, hex }) => (
              <button
                key={label}
                onClick={() => selectPenColor(hex)}
                title={label}
                className="transition-transform"
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  backgroundColor: hex,
                  border: penColor === hex ? '3px solid #fff' : '2px solid rgba(255,255,255,0.25)',
                  transform: penColor === hex ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: hex === '#FFFFFF' ? '0 0 0 1px rgba(0,0,0,0.3)' : undefined,
                }}
              />
            ))}
          </div>

          {/* Size + actions */}
          <div className="flex items-center justify-between">
            {/* Pen sizes */}
            <div className="flex items-center gap-2">
              {PEN_SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => selectPenSize(s)}
                  className="flex items-center justify-center rounded-full transition-all"
                  style={{
                    width: 40, height: 40,
                    background: penSize === s ? 'rgba(204,0,0,0.2)' : 'rgba(255,255,255,0.08)',
                    border: penSize === s ? '2px solid #CC0000' : '2px solid transparent',
                  }}
                >
                  <div style={{
                    width: s * 2, height: s * 2,
                    borderRadius: '50%',
                    backgroundColor: penColor,
                    boxShadow: penColor === '#FFFFFF' ? '0 0 0 1px rgba(0,0,0,0.4)' : undefined,
                  }} />
                </button>
              ))}
            </div>

            {/* Undo / Clear */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: 'rgba(255,255,255,0.08)', color: canUndo ? '#fff' : 'rgba(255,255,255,0.3)' }}
              >
                <Undo2 size={15} /> Undo
              </button>
              <button
                onClick={handleClear}
                disabled={!canUndo}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: 'rgba(255,255,255,0.08)', color: canUndo ? '#ef4444' : 'rgba(255,255,255,0.3)' }}
              >
                <Eraser size={15} /> Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main modal ────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex flex-col sm:items-center sm:justify-center sm:p-4" onClick={onClose}>
      <div className="mt-auto sm:mt-0 bg-white w-full sm:max-w-2xl sm:rounded-3xl shadow-2xl flex flex-col"
        style={{ maxHeight: '92vh' }} onClick={(e) => e.stopPropagation()}>

        {/* Drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Add Photo</h2>
            <p className="text-xs text-gray-400 mt-0.5">{entries.length} entr{entries.length === 1 ? 'y' : 'ies'} · same image</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 text-sm font-medium">{error}</div>
            )}

            {/* ── Photo ── */}
            <input ref={galleryRef} type="file" accept="image/*" onChange={onGalleryFile} className="hidden" />
            {preview ? (
              <div className="relative rounded-2xl overflow-hidden group">
                <img src={preview} alt="preview" className="w-full h-44 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => openAnnotation(file, preview)}
                    className="flex items-center gap-1.5 bg-white/20 backdrop-blur text-white px-4 py-2 rounded-xl text-sm font-semibold"
                  >
                    ✏️ Annotate
                  </button>
                  <button onClick={() => setCameraOpen(true)}
                    className="flex items-center gap-1.5 bg-white/20 backdrop-blur text-white px-4 py-2 rounded-xl text-sm font-semibold">
                    <Camera size={14} /> Retake
                  </button>
                  <button onClick={() => galleryRef.current?.click()}
                    className="flex items-center gap-1.5 bg-white/20 backdrop-blur text-white px-4 py-2 rounded-xl text-sm font-semibold">
                    <ImagePlus size={14} /> Replace
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-gray-700 mb-2">Photo *</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setCameraOpen(true)}
                    className="h-24 bg-primary-50 border-2 border-dashed border-primary-200 rounded-2xl flex flex-col items-center justify-center gap-1.5 active:bg-primary-100 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center shadow-md shadow-red-100">
                      <Camera size={16} className="text-white" />
                    </div>
                    <p className="text-xs font-bold text-primary-600">Take Photo</p>
                  </button>
                  <button onClick={() => galleryRef.current?.click()}
                    className="h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-1.5 active:bg-gray-100 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                      <FolderOpen size={16} className="text-gray-500" />
                    </div>
                    <p className="text-xs font-bold text-gray-500">Choose File</p>
                  </button>
                </div>
              </div>
            )}

            {/* ── Location (shared) ── */}
            <div>
              <p className="text-sm font-bold text-gray-700 mb-2">Location * <span className="text-xs font-normal text-gray-400">(shared across all entries)</span></p>
              <div className="relative">
                <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400 pointer-events-none" />
                <input value={locLoading ? '' : location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={locLoading ? 'Fetching your location…' : 'Address or landmark'}
                  disabled={locLoading}
                  className="input-field pl-9 pr-11 disabled:text-gray-400" />
                <button type="button" onClick={fetchLocation} disabled={locLoading}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-primary-500 hover:bg-primary-50 disabled:opacity-40 transition-colors">
                  {locLoading ? <Loader2 size={15} className="animate-spin" /> : <LocateFixed size={15} />}
                </button>
              </div>
              {locError && <p className="text-xs text-amber-600 mt-1.5">⚠ {locError}</p>}
            </div>

            {/* ── Entries ── */}
            <div className="space-y-3">
              {entries.map((entry, idx) => (
                <EntryBlock
                  key={entry._id}
                  entry={entry}
                  index={idx}
                  total={entries.length}
                  onChange={setEntry(entry._id)}
                  onRemove={() => removeEntry(entry._id)}
                />
              ))}
            </div>

            {/* Add entry button */}
            <button onClick={addEntry}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-gray-400 hover:border-primary-300 hover:text-primary-500 hover:bg-primary-50 active:bg-primary-100 transition-colors">
              <Plus size={16} /> Add Another Entry (same image)
            </button>

            {/* Upload progress */}
            {uploading && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span className="font-medium">Uploading…</span>
                  <span className="font-bold text-primary-500">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action bar */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-gray-100 flex gap-2 bg-white rounded-b-3xl"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          <button onClick={onClose} disabled={uploading}
            className="flex-1 py-3.5 border border-gray-200 text-gray-500 font-bold rounded-2xl active:bg-gray-50 transition-colors text-sm">
            Cancel
          </button>
          <button onClick={handleSave} disabled={uploading}
            className="flex-[2] py-3.5 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 disabled:opacity-70 text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-100 text-sm">
            {uploading
              ? <><Loader2 size={15} className="animate-spin" /> Uploading…</>
              : <><Upload size={15} /> Save {entries.length > 1 ? `${entries.length} Photos` : 'Photo'}</>}
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
        .input-field:focus { border-color: #CC0000; box-shadow: 0 0 0 3px rgba(204,0,0,0.1); background: white; }
      `}</style>
    </div>
  );
}

// ── Single entry block ────────────────────────────────────────────
function EntryBlock({ entry, index, total, onChange, onRemove }) {
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      {/* Entry header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Entry {index + 1}</span>
        {total > 1 && (
          <button onClick={onRemove}
            className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Material */}
        <div>
          <p className="text-xs font-bold text-gray-600 mb-2">Material / Type</p>
          <div className="flex flex-wrap gap-1.5">
            {MATERIALS.map((m) => (
              <button key={m} type="button"
                onClick={() => onChange('material')(entry.material === m ? '' : m)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  entry.material === m
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-600 border-gray-200 active:border-primary-300'
                }`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Dimensions */}
        <div>
          <p className="text-xs font-bold text-gray-600 mb-2">Dimensions (L × B × H)</p>
          <div className="grid grid-cols-3 gap-2">
            {[['length','L'],['breadth','B'],['height','H']].map(([field, lbl]) => (
              <div key={field}>
                <p className="text-xs text-gray-400 mb-1 text-center">{lbl}</p>
                <input value={entry[field]}
                  onChange={(e) => onChange(field)(e.target.value)}
                  placeholder="e.g. 10ft"
                  className="input-field text-center text-sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="text-xs font-bold text-gray-600 mb-2">Notes</p>
          <textarea value={entry.notes}
            onChange={(e) => onChange('notes')(e.target.value)}
            rows={2} placeholder="Any additional notes…"
            className="input-field resize-none text-sm" />
        </div>
      </div>
    </div>
  );
}
