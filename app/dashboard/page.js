'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/AuthProvider';
import Navbar from '../../components/Navbar';
import { getProjects, deleteProject } from '../../lib/apiService';
import { Plus, Search, Folder, Images, Calendar, ChevronRight, Trash2, RefreshCw, X, ShieldCheck } from 'lucide-react';

export default function DashboardPage() {
  const { user }   = useAuth();
  const router     = useRouter();
  const [projects, setProjects]   = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!user) { router.replace('/'); return; }
    load();
  }, [user]);

  const filtered = search
    ? projects.filter((p) =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.client_name?.toLowerCase().includes(search.toLowerCase()))
    : projects;

  const totalPhotos = projects.reduce((s, p) => s + (p.photo_count || 0), 0);

  const fmtDate = (ts) => ts
    ? new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '';

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
    if (!confirm(`Delete "${name}"?`)) return;
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5EDD6' }}>
      <Navbar />

      {/* Hero header */}
      <div style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 55%, #40916C 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-light tracking-widest uppercase mb-0.5" style={{ color: '#95D5B2' }}>
                {user?.role === 'admin' ? 'All Vendors' : 'My Workspace'}
              </p>
              <h1 className="text-2xl sm:text-3xl font-light text-white">
                {user?.role === 'admin' ? 'All Projects' : 'My Projects'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {user?.role === 'admin' && (
                <button onClick={() => router.push('/admin')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                  style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#D8F3DC' }}>
                  <ShieldCheck size={13} /> Admin
                </button>
              )}
              <button onClick={load}
                className="p-2.5 rounded-xl transition-colors"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                <RefreshCw size={17} className="text-white" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-2xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <p className="text-xs font-light mb-1" style={{ color: '#95D5B2' }}>Projects</p>
              <p className="text-4xl font-light text-white">{projects.length}</p>
            </div>
            <div className="rounded-2xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <p className="text-xs font-light mb-1" style={{ color: '#95D5B2' }}>Total Photos</p>
              <p className="text-4xl font-light text-white">{totalPhotos}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.4)' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects or clients…"
              className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'white',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 300,
              }}
              onFocus={(e) => { e.target.style.backgroundColor = 'rgba(255,255,255,0.18)'; }}
              onBlur={(e) => { e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: 'rgba(255,255,255,0.5)' }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#2D6A4F', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4"
              style={{ backgroundColor: '#EDE0C0' }}>
              <Folder size={34} style={{ color: '#B8A06A' }} />
            </div>
            <p className="text-lg font-light mb-1" style={{ color: '#1B3A2A' }}>
              {search ? 'No results found' : 'No projects yet'}
            </p>
            <p className="text-sm font-light mb-6" style={{ color: '#8BA898' }}>
              {search ? `Nothing matches "${search}"` : 'Tap the + button to create your first project'}
            </p>
            {!search && (
              <button onClick={() => router.push('/projects/new')}
                className="inline-flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-2xl text-sm transition-colors"
                style={{ backgroundColor: '#2D6A4F' }}>
                <Plus size={17} /> New Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={() => router.push(`/projects/${project.id}`)}
                onDelete={(e) => handleDelete(e, project.id, project.name)}
                fmtDate={fmtDate}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => router.push('/projects/new')}
        className="fixed bottom-6 right-5 z-30 flex items-center gap-2 text-white font-semibold px-5 py-3.5 rounded-full shadow-xl transition-all active:scale-95 text-sm"
        style={{ backgroundColor: '#2D6A4F', boxShadow: '0 8px 24px rgba(45,106,79,0.3)' }}>
        <Plus size={19} />
        <span>New Project</span>
      </button>
    </div>
  );
}

function ProjectCard({ project, onOpen, onDelete, fmtDate }) {
  const initials = project.name?.slice(0, 2).toUpperCase() || 'PR';
  return (
    <div onClick={onOpen}
      className="rounded-2xl border cursor-pointer group overflow-hidden transition-all hover:shadow-md active:scale-[0.98]"
      style={{ backgroundColor: '#FEFAF0', borderColor: '#DDD3B0' }}>
      {/* Top accent bar */}
      <div className="h-0.5" style={{ background: 'linear-gradient(90deg, #2D6A4F, #40916C)' }} />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#EDE0C0', border: '1px solid #DDD3B0' }}>
            <span className="font-semibold text-sm" style={{ color: '#2D6A4F' }}>{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-base leading-snug truncate" style={{ color: '#1B3A2A' }}>
                {project.name}
              </h3>
              <button onClick={onDelete}
                className="p-1.5 rounded-lg transition-colors flex-shrink-0 -mt-0.5 opacity-0 group-hover:opacity-100 sm:opacity-100 hover:bg-red-50 hover:text-red-500"
                style={{ color: '#B8A06A' }}>
                <Trash2 size={14} />
              </button>
            </div>
            <p className="text-sm font-light truncate mt-0.5" style={{ color: '#5A7A65' }}>
              {project.client_name}
            </p>
          </div>
        </div>

        {project.description && (
          <p className="text-xs font-light line-clamp-2 mt-2.5 ml-14" style={{ color: '#8BA898' }}>
            {project.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 ml-14" style={{ borderTop: '1px solid #EDE0C0' }}>
          <div className="flex items-center gap-3 text-xs" style={{ color: '#8BA898' }}>
            <span className="flex items-center gap-1 font-semibold" style={{ color: '#2D6A4F' }}>
              <Images size={12} /> {project.photo_count || 0} photos
            </span>
            <span className="flex items-center gap-1 font-light">
              <Calendar size={11} /> {fmtDate(project.created_at)}
            </span>
          </div>
          <ChevronRight size={15} style={{ color: '#B8A06A' }} className="group-hover:text-forest-600 transition-colors" />
        </div>
      </div>
    </div>
  );
}
