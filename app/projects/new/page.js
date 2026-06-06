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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-br from-primary-700 via-primary-500 to-red-400 text-white px-4 sm:px-6 lg:px-8 pt-5 pb-8 max-w-7xl mx-auto">
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-red-200 active:text-white transition-colors text-sm mb-4">
          <ArrowLeft size={15} /> Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
            <FolderPlus size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black">New Project</h1>
            <p className="text-red-200 text-sm">Fill in the details below</p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="max-w-lg mx-auto px-4 sm:px-6 -mt-4">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 text-sm font-medium">
                {error}
              </div>
            )}

            <FormField label="Project Name *" icon={<FolderPlus size={16} className="text-primary-500" />}>
              <input required value={form.name} onChange={set('name')} maxLength={80}
                placeholder="e.g. Metro Station Campaign"
                className="input-field" />
            </FormField>

            <FormField label="Client Name *" icon={<Building2 size={16} className="text-primary-500" />}>
              <input required value={form.clientName} onChange={set('clientName')} maxLength={80}
                placeholder="e.g. Reliance Industries"
                className="input-field" />
            </FormField>

            <FormField label="Description" icon={<AlignLeft size={16} className="text-gray-400" />}>
              <textarea value={form.description} onChange={set('description')} maxLength={300} rows={3}
                placeholder="Brief description (optional)"
                className="input-field resize-none" />
            </FormField>

            <button type="submit" disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 active:bg-primary-700 disabled:opacity-70 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 text-base shadow-lg shadow-red-100 mt-2">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Creating…</> : 'Create Project'}
            </button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        .input-field {
          width: 100%; padding: 0.85rem 1rem;
          border: 1.5px solid #e5e7eb; border-radius: 1rem;
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

const FormField = ({ label, icon, children }) => (
  <div>
    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
      {icon} {label}
    </label>
    {children}
  </div>
);
