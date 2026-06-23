'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../components/AuthProvider';
import Navbar from '../../../components/Navbar';
import { createProject } from '../../../lib/apiService';
import { ArrowLeft, Loader2, FolderPlus, Building2, AlignLeft } from 'lucide-react';

export default function NewProjectPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const [form, setForm]       = useState({ name: '', clientName: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.clientName.trim()) {
      setError('Project name and client name are required.');
      return;
    }
    setLoading(true);
    try {
      const ref = await createProject({
        name: form.name.trim(),
        clientName: form.clientName.trim(),
        description: form.description.trim(),
      });
      router.replace(`/projects/${ref.id}`);
    } catch {
      setError('Failed to create project. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5EDD6' }}>
      <Navbar />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 55%, #40916C 100%)' }}
        className="px-4 sm:px-6 lg:px-8 pt-5 pb-8 max-w-7xl mx-auto">
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm mb-4 transition-opacity hover:opacity-80"
          style={{ color: '#95D5B2' }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <FolderPlus size={21} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-light text-white">New Project</h1>
            <p className="text-sm font-light" style={{ color: '#95D5B2' }}>Fill in the details below</p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="max-w-lg mx-auto px-4 sm:px-6 -mt-4">
        <div className="rounded-3xl border overflow-hidden"
          style={{ backgroundColor: '#FEFAF0', borderColor: '#DDD3B0' }}>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="rounded-2xl px-4 py-3 text-sm font-medium border"
                style={{ backgroundColor: '#fff0f0', borderColor: '#fcc', color: '#c0392b' }}>
                {error}
              </div>
            )}

            <FormField label="Project Name *" icon={<FolderPlus size={15} style={{ color: '#2D6A4F' }} />}>
              <input required value={form.name} onChange={set('name')} maxLength={80}
                placeholder="e.g. Metro Station Campaign"
                className="input-field" />
            </FormField>

            <FormField label="Client Name *" icon={<Building2 size={15} style={{ color: '#2D6A4F' }} />}>
              <input required value={form.clientName} onChange={set('clientName')} maxLength={80}
                placeholder="e.g. Reliance Industries"
                className="input-field" />
            </FormField>

            <FormField label="Description" icon={<AlignLeft size={15} style={{ color: '#8BA898' }} />}>
              <textarea value={form.description} onChange={set('description')} maxLength={300} rows={3}
                placeholder="Brief description (optional)"
                className="input-field resize-none" />
            </FormField>

            <button type="submit" disabled={loading}
              className="w-full text-white font-semibold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm mt-2 disabled:opacity-70"
              style={{ backgroundColor: '#2D6A4F' }}>
              {loading ? <><Loader2 size={17} className="animate-spin" /> Creating…</> : 'Create Project'}
            </button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        .input-field {
          width: 100%; padding: 0.85rem 1rem;
          border: 1.5px solid #DDD3B0; border-radius: 1rem;
          font-size: 0.925rem; color: #1B3A2A;
          outline: none; background: #F5EDD6;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: Outfit, sans-serif;
          font-weight: 300;
          -webkit-appearance: none;
        }
        .input-field::placeholder { color: #B8A06A; }
        .input-field:focus {
          border-color: #2D6A4F;
          box-shadow: 0 0 0 3px rgba(45,106,79,0.12);
          background: #FEFAF0;
        }
      `}</style>
    </div>
  );
}

const FormField = ({ label, icon, children }) => (
  <div>
    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2"
      style={{ color: '#5A7A65' }}>
      {icon} {label}
    </label>
    {children}
  </div>
);
