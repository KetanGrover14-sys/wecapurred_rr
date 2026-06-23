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
    <div className="min-h-screen" style={{ backgroundColor: '#F5EDD6' }}>
      <Navbar />

      <div style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 55%, #40916C 100%)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl p-2.5" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                <ShieldCheck size={21} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-light text-white">Admin Panel</h1>
                <p className="text-sm font-light" style={{ color: '#95D5B2' }}>Manage vendor accounts</p>
              </div>
            </div>
            <button onClick={load} className="p-2.5 rounded-xl transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
              <RefreshCw size={17} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24">
        {!showForm ? (
          <button onClick={() => setShowForm(true)}
            className="mb-6 flex items-center gap-2 text-white font-semibold px-5 py-3 rounded-2xl text-sm transition-colors"
            style={{ backgroundColor: '#2D6A4F' }}>
            <Plus size={17} /> Add Vendor
          </button>
        ) : (
          <div className="mb-6 rounded-2xl border p-5"
            style={{ backgroundColor: '#FEFAF0', borderColor: '#DDD3B0' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg" style={{ color: '#1B3A2A' }}>New Vendor</h2>
              <button onClick={() => { setShowForm(false); setFormError(''); }}
                className="p-1.5 rounded-xl transition-colors hover:bg-gray-100"
                style={{ color: '#8BA898' }}>
                <X size={17} />
              </button>
            </div>
            {formError && (
              <div className="rounded-xl px-4 py-2.5 mb-4 text-sm font-medium border"
                style={{ backgroundColor: '#fff0f0', borderColor: '#fcc', color: '#c0392b' }}>
                {formError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-3">
              {[
                { label: 'Full Name', key: 'name', type: 'text', val: name, set: setName, ph: 'Vendor Name' },
                { label: 'Email', key: 'email', type: 'email', val: email, set: setEmail, ph: 'vendor@company.com' },
              ].map(({ label, type, val, set: setter, ph }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1"
                    style={{ color: '#5A7A65' }}>{label}</label>
                  <input required type={type} value={val} onChange={(e) => setter(e.target.value)}
                    placeholder={ph}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ border: '1.5px solid #DDD3B0', backgroundColor: '#F5EDD6', color: '#1B3A2A', fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}
                    onFocus={(e) => { e.target.style.borderColor = '#2D6A4F'; e.target.style.boxShadow = '0 0 0 3px rgba(45,106,79,0.12)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#DDD3B0'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: '#5A7A65' }}>Password</label>
                <div className="relative">
                  <input required type={showPwd ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set a strong password"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none pr-11"
                    style={{ border: '1.5px solid #DDD3B0', backgroundColor: '#F5EDD6', color: '#1B3A2A', fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}
                    onFocus={(e) => { e.target.style.borderColor = '#2D6A4F'; e.target.style.boxShadow = '0 0 0 3px rgba(45,106,79,0.12)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#DDD3B0'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                    style={{ color: '#8BA898' }}>
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowForm(false); setFormError(''); }}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm transition-colors"
                  style={{ border: '1.5px solid #DDD3B0', color: '#5A7A65', backgroundColor: 'transparent' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-70"
                  style={{ backgroundColor: '#2D6A4F' }}>
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Vendor list */}
        <div className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: '#FEFAF0', borderColor: '#DDD3B0' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #EDE0C0' }}>
            <h2 className="font-semibold" style={{ color: '#1B3A2A' }}>
              Vendors <span className="font-light text-sm" style={{ color: '#8BA898' }}>({vendors.length})</span>
            </h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: '#2D6A4F', borderTopColor: 'transparent' }} />
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-16" style={{ color: '#8BA898' }}>
              <User size={34} className="mx-auto mb-3" style={{ color: '#CAB98A' }} />
              <p className="font-semibold text-sm">No vendors yet</p>
              <p className="text-sm font-light">Add your first vendor above</p>
            </div>
          ) : (
            <ul className="divide-y" style={{ '--tw-divide-opacity': 1, borderColor: '#EDE0C0' }}>
              {vendors.map((v) => (
                <li key={v.id}
                  className="flex items-center gap-3 px-5 py-4 transition-colors group"
                  style={{ '--hover-bg': '#F5EDD6' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5EDD6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#EDE0C0', border: '1px solid #DDD3B0' }}>
                    <span className="font-semibold text-sm" style={{ color: '#2D6A4F' }}>
                      {v.name[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: '#1B3A2A' }}>{v.name}</p>
                    <p className="text-xs font-light truncate" style={{ color: '#8BA898' }}>{v.email}</p>
                  </div>
                  <span className="hidden sm:block text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                    style={{ backgroundColor: '#d8f3e6', color: '#1B4332' }}>
                    {v.role}
                  </span>
                  <button onClick={() => handleDelete(v.id, v.name)}
                    className="p-2 rounded-xl transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100 hover:bg-red-50 hover:text-red-500"
                    style={{ color: '#B8A06A' }}>
                    <Trash2 size={15} />
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
