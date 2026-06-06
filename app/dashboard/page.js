'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/AuthProvider';
import Navbar from '../../components/Navbar';
import { getProjects, deleteProject } from '../../lib/apiService';
import { Plus, Search, Folder, Images, Calendar, ChevronRight, Trash2, RefreshCw, X } from 'lucide-react';

export default function DashboardPage() {
  const { user }   = useAuth();
  const router     = useRouter();
  const [projects, setProjects]   = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero header */}
      <div className="bg-gradient-to-br from-primary-700 via-primary-500 to-red-400 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-red-200 text-sm font-medium">Good day 👋</p>
              <h1 className="text-2xl sm:text-3xl font-black mt-0.5">My Projects</h1>
            </div>
            <button onClick={load}
              className="p-2.5 bg-white/15 hover:bg-white/25 active:bg-white/30 rounded-xl transition-colors">
              <RefreshCw size={18} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-white/15 backdrop-blur rounded-2xl p-4">
              <p className="text-red-200 text-xs font-medium mb-1">Projects</p>
              <p className="text-4xl font-black">{projects.length}</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-2xl p-4">
              <p className="text-red-200 text-xs font-medium mb-1">Total Photos</p>
              <p className="text-4xl font-black">{totalPhotos}</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects or clients…"
              className="w-full pl-10 pr-4 py-3 bg-white/15 backdrop-blur border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:bg-white/25 transition-colors text-sm" />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-1">
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
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-3xl mb-4">
              <Folder size={36} className="text-gray-300" />
            </div>
            <p className="text-lg font-bold text-gray-400 mb-1">
              {search ? 'No results found' : 'No projects yet'}
            </p>
            <p className="text-sm text-gray-300 mb-6">
              {search ? `Nothing matches "${search}"` : 'Tap the + button to create your first project'}
            </p>
            {!search && (
              <button onClick={() => router.push('/projects/new')}
                className="inline-flex items-center gap-2 bg-primary-500 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-red-100 active:bg-primary-600 transition-colors">
                <Plus size={18} /> New Project
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
        className="fixed bottom-6 right-5 z-30 flex items-center gap-2 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-bold px-5 py-3.5 rounded-full shadow-xl shadow-red-200 transition-all active:scale-95">
        <Plus size={20} />
        <span className="text-sm">New Project</span>
      </button>
    </div>
  );
}

function ProjectCard({ project, onOpen, onDelete, fmtDate }) {
  const initials = project.name?.slice(0, 2).toUpperCase() || 'PR';
  return (
    <div onClick={onOpen}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm active:shadow-md active:scale-[0.98] transition-all cursor-pointer group overflow-hidden">
      {/* Top color bar */}
      <div className="h-1 bg-gradient-to-r from-primary-600 to-red-400" />
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-11 h-11 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-primary-600 font-black text-sm">{initials}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-gray-900 text-base leading-snug truncate">{project.name}</h3>
              <button onClick={onDelete}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors flex-shrink-0 -mt-0.5 opacity-0 group-hover:opacity-100 sm:opacity-100">
                <Trash2 size={14} />
              </button>
            </div>
            <p className="text-sm text-gray-400 truncate mt-0.5">{project.client_name}</p>
          </div>
        </div>

        {project.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mt-2.5 ml-14">{project.description}</p>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 ml-14">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1 font-semibold text-primary-500">
              <Images size={12} /> {project.photo_count || 0} photos
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={11} /> {fmtDate(project.created_at)}
            </span>
          </div>
          <ChevronRight size={15} className="text-gray-300 group-hover:text-primary-400 transition-colors" />
        </div>
      </div>
    </div>
  );
}
