'use client';
import { useState, useRef } from 'react';
import { Upload, Download, Trash2, CheckCircle, XCircle, Clock, FileText, Wrench, Loader2 } from 'lucide-react';
import { uploadProjectFile, deleteProjectFile, reviewInstallationFile } from '../lib/apiService';

const STATUS_CONFIG = {
  pending:  { label: 'Pending Review', color: 'bg-amber-50 text-amber-700 border-amber-200',  Icon: Clock         },
  approved: { label: 'Approved',        color: 'bg-green-50 text-green-700 border-green-200',   Icon: CheckCircle   },
  declined: { label: 'Declined',        color: 'bg-red-50 text-red-700 border-red-200',         Icon: XCircle       },
};

export default function ProjectFilesSection({ projectId, user, files, onFilesChanged }) {
  const racceFiles       = files.filter((f) => f.type === 'racce');
  const installFiles     = files.filter((f) => f.type === 'installation');

  return (
    <div className="space-y-4">
      <FileGroup
        title="RACCE File"
        icon={<FileText size={16} className="text-blue-500" />}
        accentColor="blue"
        files={racceFiles}
        type="racce"
        projectId={projectId}
        user={user}
        canUpload={true}
        onFilesChanged={onFilesChanged}
      />
      <FileGroup
        title="Installation File"
        icon={<Wrench size={16} className="text-purple-500" />}
        accentColor="purple"
        files={installFiles}
        type="installation"
        projectId={projectId}
        user={user}
        canUpload={user?.role === 'admin'}
        onFilesChanged={onFilesChanged}
      />
    </div>
  );
}

function FileGroup({ title, icon, accentColor, files, type, projectId, user, canUpload, onFilesChanged }) {
  const [uploading, setUploading]   = useState(false);
  const [progress, setProgress]     = useState(0);
  const [uploadError, setUploadError] = useState('');
  const inputRef = useRef(null);

  const colorMap = {
    blue:   { ring: 'ring-blue-200',   bg: 'bg-blue-50',   btn: 'bg-blue-500 hover:bg-blue-600',   text: 'text-blue-600', border: 'border-blue-100' },
    purple: { ring: 'ring-purple-200', bg: 'bg-purple-50', btn: 'bg-purple-500 hover:bg-purple-600', text: 'text-purple-600', border: 'border-purple-100' },
  };
  const c = colorMap[accentColor];

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    setProgress(0);
    try {
      await uploadProjectFile(projectId, type, file, setProgress);
      onFilesChanged();
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 ${c.bg} border-b ${c.border}`}>
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-bold text-gray-800 text-sm">{title}</span>
          <span className="text-xs text-gray-400">({files.length})</span>
        </div>
        {canUpload && (
          <>
            <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className={`flex items-center gap-1.5 ${c.btn} disabled:opacity-60 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors`}>
              {uploading
                ? <><Loader2 size={13} className="animate-spin" /> {progress}%</>
                : <><Upload size={13} /> Upload</>}
            </button>
          </>
        )}
      </div>

      {uploadError && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-xs font-medium border-b border-red-100">
          {uploadError}
        </div>
      )}

      {files.length === 0 ? (
        <div className="px-4 py-5 text-center text-gray-400 text-sm">
          {canUpload ? 'No files yet — click Upload to add one.' : 'No files uploaded yet.'}
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {files.map((file) => (
            <FileRow
              key={file.id}
              file={file}
              projectId={projectId}
              user={user}
              accentColor={accentColor}
              onFilesChanged={onFilesChanged}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

const TOKEN_KEY = 'wecapurred_token';

function FileRow({ file, projectId, user, accentColor, onFilesChanged }) {
  const [reviewing, setReviewing] = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : '';

  const colorMap = {
    blue:   { dl: 'bg-blue-50 hover:bg-blue-100 text-blue-700' },
    purple: { dl: 'bg-purple-50 hover:bg-purple-100 text-purple-700' },
  };
  const c = colorMap[accentColor];

  const fmtDate = (ts) => ts
    ? new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
    : '';

  const canDelete = user?.role === 'admin' || file.uploaded_by === user?.id;
  const canReview = file.type === 'installation' && file.status === 'pending' && user?.role !== 'admin';

  const handleReview = async (action) => {
    setReviewing(true);
    try {
      await reviewInstallationFile(projectId, file.id, action);
      onFilesChanged();
    } catch { /* silently fail */ }
    finally { setReviewing(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${file.file_name}"?`)) return;
    setDeleting(true);
    try {
      await deleteProjectFile(projectId, file.id);
      onFilesChanged();
    } catch { /* silently fail */ }
    finally { setDeleting(false); }
  };

  const statusCfg = file.status ? STATUS_CONFIG[file.status] : null;

  return (
    <li className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{file.file_name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          By {file.uploaded_by_name} · {fmtDate(file.created_at)}
        </p>

        {/* Status badge for installation files */}
        {statusCfg && (
          <div className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full border text-xs font-semibold ${statusCfg.color}`}>
            <statusCfg.Icon size={10} />
            {statusCfg.label}
            {file.reviewed_by_name && file.status !== 'pending' && (
              <span className="font-normal opacity-70"> · {file.reviewed_by_name}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
        {/* Approve / Decline for vendor on pending installation files */}
        {canReview && (
          <>
            <button onClick={() => handleReview('approve')} disabled={reviewing}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50">
              {reviewing ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
              Approve
            </button>
            <button onClick={() => handleReview('decline')} disabled={reviewing}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50">
              <XCircle size={12} /> Decline
            </button>
          </>
        )}

        {/* Download via proxy — token in query param since <a href> can't set headers */}
        <a href={`/api/projects/${projectId}/files/${file.id}/download?token=${token}`}
          className={`flex items-center gap-1 px-2.5 py-1.5 ${c.dl} text-xs font-semibold rounded-xl transition-colors`}>
          <Download size={12} /> Download
        </a>

        {/* Delete */}
        {canDelete && (
          <button onClick={handleDelete} disabled={deleting}
            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100 disabled:opacity-50">
            {deleting ? <Loader2 size={14} className="animate-spin text-gray-400" /> : <Trash2 size={14} />}
          </button>
        )}
      </div>
    </li>
  );
}
