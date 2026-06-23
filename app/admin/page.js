'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/AuthProvider';
import Navbar from '../../components/Navbar';
import { getVendors, createVendor, deleteVendor } from '../../lib/apiService';
import { ShieldCheck, Plus, Trash2, User, RefreshCw, X, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AdminPage() {
  const { user }  = useAuth();
  const router    = useRouter();

  const [vendors, setVendors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVendors();
      setVendors(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!user) { router.replace('/'); return; }
    if (user.role !== 'admin') { router.replace('/dashboard'); return; }
    load();
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const res = await createVendor({ name, email, password });
      if (res.error) { setFormError(res.error); }
      else {
        setVendors((prev) => [...prev, res]);
        setName(''); setEmail(''); setPassword('');
        setShowForm(false);
      }
    } catch { setFormError('Failed to create vendor. Try again.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, vendorName) => {
    if (!confirm(`Remove vendor "${vendorName}"? Their projects will remain but they won't be able to log in.`)) return;
    await deleteVendor(id);
    setVendors((prev) => prev.filter((v) => v.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="bg-gradient-to-br from-amber-600 via-amber-500 to-orange-400 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-2xl p-2.5">
                <ShieldCheck size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black">Admin Panel</h1>
                <p className="text-amber-100 text-sm">Manage vendor accounts</p>
              </div>
            </div>
            <button onClick={load} className="p-2.5 bg-white/15 hover:bg-white/25 rounded-xl transition-colors">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24">
        {/* Add vendor button / form */}
        {!showForm ? (
          <button onClick={() => setShowForm(true)}
            className="mb-6 flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-red-100 transition-colors">
            <Plus size={18} /> Add Vendor
          </button>
        ) : (
          <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 text-lg">New Vendor</h2>
              <button onClick={() => { setShowForm(false); setFormError(''); }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 mb-4 text-sm font-medium">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Vendor Name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="vendor@company.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input required type={showPwd ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set a strong password"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50 pr-11" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowForm(false); setFormError(''); }}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-70 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                  {saving ? <><Loader2 size={15} className="animate-spin" /> Creating…</> : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Vendor list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-800">Vendors <span className="text-gray-400 font-normal text-sm">({vendors.length})</span></h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <User size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="font-semibold">No vendors yet</p>
              <p className="text-sm">Add your first vendor above</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {vendors.map((v) => (
                <li key={v.id} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-bold text-sm">{v.name[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{v.name}</p>
                    <p className="text-xs text-gray-400 truncate">{v.email}</p>
                  </div>
                  <span className="hidden sm:block text-xs bg-blue-50 text-blue-600 font-semibold px-2.5 py-1 rounded-full capitalize">
                    {v.role}
                  </span>
                  <button onClick={() => handleDelete(v.id, v.name)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100">
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
