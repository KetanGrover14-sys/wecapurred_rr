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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-br from-primary-700 via-primary-500 to-red-400 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <button onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-red-200 active:text-white transition-colors text-sm mb-3">
            <ArrowLeft size={15} /> All Projects
          </button>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black truncate">{project.name}</h1>
              <p className="text-red-200 text-sm mt-0.5 truncate">Client: {project.client_name}</p>
              {project.description && <p className="text-red-300 text-xs mt-1 line-clamp-2">{project.description}</p>}
            </div>
            <div className="flex-shrink-0 bg-white/15 rounded-2xl px-3 py-2 text-center">
              <p className="text-2xl font-black">{groupedPhotos.length}</p>
              <p className="text-red-200 text-xs">photos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop toolbar */}
      <div className="hidden sm:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm text-sm">
            <Plus size={16} className="text-primary-500" /> Add Photo
          </button>
          <button onClick={() => { loadPhotos(); loadFiles(); }}
            className="p-2.5 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-colors">
            <RefreshCw size={15} className="text-gray-400" />
          </button>
          <button onClick={handleCreatePPT} disabled={generating || !photos.length}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-red-100 text-sm">
            {generating ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <><FileDown size={16} /> Create PPT</>}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:pt-0 pt-4 pb-4">

        {/* ── Project Files (RACCE + Installation) ─────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen size={16} className="text-gray-400" />
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Project Files</h2>
          </div>
          <ProjectFilesSection
            projectId={id}
            user={user}
            files={files}
            onFilesChanged={loadFiles}
          />
        </div>

        {/* ── Photo Gallery ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Camera size={16} className="text-gray-400" />
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Site Photos</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-14">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-3xl mb-3">
                <Camera size={28} className="text-gray-300" />
              </div>
              <p className="text-base font-bold text-gray-400 mb-1">No photos yet</p>
              <p className="text-sm text-gray-300 mb-5">Tap the + button to add your first banner photo</p>
              <button onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-2 bg-primary-500 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-red-100">
                <Plus size={18} /> Add First Photo
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
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-100 shadow-lg px-4 py-3 flex gap-2"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <button onClick={() => setShowAdd(true)}
          className="flex-1 flex items-center justify-center gap-2 border-2 border-primary-500 text-primary-500 font-bold py-3 rounded-2xl active:bg-primary-50 transition-colors text-sm">
          <Plus size={18} /> Add Photo
        </button>
        <button onClick={handleCreatePPT} disabled={generating || !photos.length}
          className="flex-1 flex items-center justify-center gap-2 bg-primary-500 active:bg-primary-600 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-colors text-sm shadow-lg shadow-red-100">
          {generating
            ? <><Loader2 size={16} className="animate-spin" /> Generating…</>
            : <><FileDown size={16} /> Create PPT</>}
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
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 active:scale-[0.97] transition-all cursor-pointer group">
      <div className="relative h-40 sm:h-44 overflow-hidden bg-gray-100">
        <img src={first.image_url} alt="Banner"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        {first.material && (
          <span className="absolute top-2 left-2 bg-primary-500/90 backdrop-blur text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {first.material}{multiEntry ? ` +${group.length - 1}` : ''}
          </span>
        )}
        {multiEntry && !first.material && (
          <span className="absolute top-2 left-2 bg-black/50 backdrop-blur text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {group.length} entries
          </span>
        )}
      </div>
      <div className="p-2.5 space-y-1">
        {first.location && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin size={10} className="text-primary-500 flex-shrink-0" />
            <span className="truncate">{first.location}</span>
          </div>
        )}
        {(first.length || first.breadth || first.height) && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Ruler size={10} className="flex-shrink-0" />
            <span className="truncate">
              {[first.length && `L:${first.length}`, first.breadth && `B:${first.breadth}`, first.height && `H:${first.height}`].filter(Boolean).join(' ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
