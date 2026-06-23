'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../components/AuthProvider';
import Navbar from '../../../components/Navbar';
import AddPhotoModal from '../../../components/AddPhotoModal';
import PhotoDetailModal from '../../../components/PhotoDetailModal';
import ProjectFilesSection from '../../../components/ProjectFilesSection';
import { getProject, getPhotos, getProjectFiles } from '../../../lib/apiService';
import { generatePPT } from '../../../lib/pptService';
import { ArrowLeft, Plus, FileDown, MapPin, Ruler, Loader2, Camera, RefreshCw, FolderOpen } from 'lucide-react';

export default function ProjectPage() {
  const { user }    = useAuth();
  const router      = useRouter();
  const { id }      = useParams();

  const [project, setProject]       = useState(null);
  const [photos, setPhotos]         = useState([]);
  const [files, setFiles]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [selected, setSelected]     = useState(null);
  const [generating, setGenerating] = useState(false);

  const groupedPhotos = useMemo(() => {
    const map = new Map();
    photos.forEach((p) => {
      if (!map.has(p.image_url)) map.set(p.image_url, []);
      map.get(p.image_url).push(p);
    });
    return [...map.values()];
  }, [photos]);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPhotos(id);
      setPhotos(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [id]);

  const loadFiles = useCallback(async () => {
    try {
      const data = await getProjectFiles(id);
      setFiles(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  }, [id]);

  useEffect(() => {
    if (!user) { router.replace('/'); return; }
    getProject(id).then(setProject).catch(console.error);
    loadPhotos();
    loadFiles();
  }, [id, user]);

  const handlePhotoAdded = async () => {
    setShowAdd(false);
    await loadPhotos();
    getProject(id).then(setProject).catch(console.error);
  };

  const handlePhotoDeleted = async () => {
    setSelected(null);
    await loadPhotos();
    getProject(id).then(setProject).catch(console.error);
  };

  const handleCreatePPT = async () => {
    if (!photos.length) return alert('Add at least one photo first.');
    setGenerating(true);
    try { await generatePPT(project, photos); }
    catch (e) { console.error(e); alert('Failed to generate PPT. Please try again.'); }
    finally { setGenerating(false); }
  };

  if (!project) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F5EDD6' }}>
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#2D6A4F', borderTopColor: 'transparent' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: '#F5EDD6' }}>
      <Navbar />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 55%, #40916C 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <button onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-sm mb-3 transition-opacity hover:opacity-80"
            style={{ color: '#95D5B2' }}>
            <ArrowLeft size={14} /> All Projects
          </button>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-light text-white truncate">{project.name}</h1>
              <p className="text-sm font-light mt-0.5 truncate" style={{ color: '#95D5B2' }}>
                Client: {project.client_name}
              </p>
              {project.description && (
                <p className="text-xs font-light mt-1 line-clamp-2" style={{ color: '#74C69D' }}>
                  {project.description}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 rounded-2xl px-3 py-2 text-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
              <p className="text-2xl font-light text-white">{groupedPhotos.length}</p>
              <p className="text-xs font-light" style={{ color: '#95D5B2' }}>photos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop toolbar */}
      <div className="hidden sm:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 border font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
            style={{ backgroundColor: '#FEFAF0', borderColor: '#DDD3B0', color: '#1B3A2A' }}>
            <Plus size={15} style={{ color: '#2D6A4F' }} /> Add Photo
          </button>
          <button onClick={() => { loadPhotos(); loadFiles(); }}
            className="p-2.5 border rounded-xl transition-colors"
            style={{ backgroundColor: '#FEFAF0', borderColor: '#DDD3B0' }}>
            <RefreshCw size={14} style={{ color: '#8BA898' }} />
          </button>
          <button onClick={handleCreatePPT} disabled={generating || !photos.length}
            className="flex items-center gap-2 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#2D6A4F' }}>
            {generating ? <><Loader2 size={15} className="animate-spin" /> Generating…</> : <><FileDown size={15} /> Create PPT</>}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:pt-0 pt-4 pb-4">

        {/* ── Project Files ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen size={14} style={{ color: '#8BA898' }} />
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#8BA898' }}>
              Project Files
            </h2>
          </div>
          <ProjectFilesSection projectId={id} user={user} files={files} onFilesChanged={loadFiles} />
        </div>

        {/* ── Photo Gallery ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Camera size={14} style={{ color: '#8BA898' }} />
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#8BA898' }}>
              Site Photos
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: '#2D6A4F', borderTopColor: 'transparent' }} />
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-14">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-3"
                style={{ backgroundColor: '#EDE0C0' }}>
                <Camera size={26} style={{ color: '#B8A06A' }} />
              </div>
              <p className="text-base font-light mb-1" style={{ color: '#1B3A2A' }}>No photos yet</p>
              <p className="text-sm font-light mb-5" style={{ color: '#8BA898' }}>
                Tap the + button to add your first banner photo
              </p>
              <button onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-2xl text-sm"
                style={{ backgroundColor: '#2D6A4F' }}>
                <Plus size={17} /> Add First Photo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {groupedPhotos.map((group) => (
                <PhotoCard key={group[0].image_url} group={group} onClick={() => setSelected(group)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom action bar */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 border-t px-4 py-3 flex gap-2"
        style={{ backgroundColor: '#FEFAF0', borderColor: '#DDD3B0', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <button onClick={() => setShowAdd(true)}
          className="flex-1 flex items-center justify-center gap-2 border-2 font-semibold py-3 rounded-2xl transition-colors text-sm"
          style={{ borderColor: '#2D6A4F', color: '#2D6A4F' }}>
          <Plus size={17} /> Add Photo
        </button>
        <button onClick={handleCreatePPT} disabled={generating || !photos.length}
          className="flex-1 flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-2xl transition-colors text-sm disabled:opacity-50"
          style={{ backgroundColor: '#2D6A4F' }}>
          {generating
            ? <><Loader2 size={15} className="animate-spin" /> Generating…</>
            : <><FileDown size={15} /> Create PPT</>}
        </button>
      </div>

      {showAdd && (
        <AddPhotoModal projectId={id} onClose={() => setShowAdd(false)} onAdded={handlePhotoAdded} />
      )}
      {selected && (
        <PhotoDetailModal photos={selected} projectId={id} onClose={() => setSelected(null)} onDeleted={handlePhotoDeleted} />
      )}
    </div>
  );
}

function PhotoCard({ group, onClick }) {
  const first = group[0];
  const multiEntry = group.length > 1;
  return (
    <div onClick={onClick}
      className="rounded-2xl overflow-hidden border cursor-pointer group active:scale-[0.97] transition-all hover:shadow-md"
      style={{ backgroundColor: '#FEFAF0', borderColor: '#DDD3B0' }}>
      <div className="relative h-40 sm:h-44 overflow-hidden" style={{ backgroundColor: '#EDE0C0' }}>
        <img src={first.image_url} alt="Banner"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        {first.material && (
          <span className="absolute top-2 left-2 backdrop-blur text-white text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(45,106,79,0.85)' }}>
            {first.material}{multiEntry ? ` +${group.length - 1}` : ''}
          </span>
        )}
        {multiEntry && !first.material && (
          <span className="absolute top-2 left-2 backdrop-blur text-white text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
            {group.length} entries
          </span>
        )}
      </div>
      <div className="p-2.5 space-y-1">
        {first.location && (
          <div className="flex items-center gap-1 text-xs" style={{ color: '#5A7A65' }}>
            <MapPin size={10} style={{ color: '#2D6A4F' }} className="flex-shrink-0" />
            <span className="truncate font-light">{first.location}</span>
          </div>
        )}
        {(first.length || first.breadth || first.height) && (
          <div className="flex items-center gap-1 text-xs" style={{ color: '#8BA898' }}>
            <Ruler size={10} className="flex-shrink-0" />
            <span className="truncate font-light">
              {[first.length && `L:${first.length}`, first.breadth && `B:${first.breadth}`, first.height && `H:${first.height}`].filter(Boolean).join(' ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
