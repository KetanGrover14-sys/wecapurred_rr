'use client';
import { useState } from 'react';
import { X, MapPin, Ruler, Layers, FileText, Trash2, Calendar, Loader2 } from 'lucide-react';
import { deletePhoto } from '../lib/apiService';

export default function PhotoDetailModal({ photo, projectId, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const dims = [
    photo.length  && `L: ${photo.length}`,
    photo.breadth && `B: ${photo.breadth}`,
    photo.height  && `H: ${photo.height}`,
  ].filter(Boolean).join('   ');

  const date = photo.created_at
    ? new Date(photo.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  const handleDelete = async () => {
    if (!confirm('Delete this photo permanently?')) return;
    setDeleting(true);
    try {
      await deletePhoto(projectId, photo.id);
      onDeleted();
    } catch (e) {
      console.error(e);
      setDeleting(false);
    }
  };

  const hasSpecs = photo.location || dims || photo.material || photo.notes;

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 bg-black/70 flex flex-col sm:items-center sm:justify-center sm:p-4"
      onClick={onClose}>

      {/* Sheet */}
      <div className="mt-auto sm:mt-0 bg-white w-full sm:max-w-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        style={{ maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Photo Details</h2>
          <div className="flex items-center gap-1">
            <button onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 text-red-500 active:bg-red-50 hover:bg-red-50 rounded-xl transition-colors text-sm font-semibold disabled:opacity-50">
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors">
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(92vh - 60px)' }}>
          {/* Image */}
          <div className="bg-gray-950 flex items-center justify-center" style={{ minHeight: 240 }}>
            <img src={photo.image_url} alt="Banner"
              className="w-full object-contain"
              style={{ maxHeight: 340 }} />
          </div>

          {/* Specs */}
          <div className="p-5">
            <p className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-4">Specifications</p>

            {hasSpecs ? (
              <div className="space-y-3">
                {photo.location && (
                  <SpecRow icon={<MapPin size={14} className="text-primary-500" />} label="Location" value={photo.location} />
                )}
                {dims && (
                  <SpecRow icon={<Ruler size={14} className="text-primary-500" />} label="Dimensions" value={dims} />
                )}
                {photo.material && (
                  <SpecRow icon={<Layers size={14} className="text-primary-500" />} label="Material"
                    value={
                      <span className="inline-block bg-primary-50 text-primary-600 border border-primary-200 rounded-full px-3 py-0.5 text-xs font-bold">
                        {photo.material}
                      </span>
                    }
                  />
                )}
                {photo.notes && (
                  <SpecRow icon={<FileText size={14} className="text-primary-500" />} label="Notes" value={photo.notes} />
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No specifications added.</p>
            )}

            {date && (
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-400">
                <Calendar size={12} /> Added {date}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const SpecRow = ({ icon, label, value }) => (
  <div className="flex gap-3 items-start">
    <div className="w-8 h-8 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0 pt-0.5">
      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{label}</p>
      <div className="text-gray-800 text-sm leading-relaxed break-words">{value}</div>
    </div>
  </div>
);
