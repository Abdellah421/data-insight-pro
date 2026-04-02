import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, AlertCircle, CheckCircle, X } from 'lucide-react';
import { loadProjectFromFile } from '../utils/exporters';
import { validateDIPProject } from '../utils/dipSchema';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import { DIPProject } from '../types';

interface LoadProjectDropzoneProps {
  onClose: () => void;
}

const LoadProjectDropzone: React.FC<LoadProjectDropzoneProps> = ({ onClose }) => {
  const { dispatch } = useProject();
  const { showToast } = useToast();
  const [preview, setPreview] = useState<DIPProject | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileError(null);
    setPreview(null);
    setIsLoading(true);

    try {
      const raw = await loadProjectFromFile(file);
      const validation = validateDIPProject(raw);

      if (!validation.success) {
        setFileError(validation.error || 'Invalid .dip file.');
        showToast(validation.error || 'Invalid .dip file.', 'error');
        return;
      }

      setPreview(raw as DIPProject);
    } catch (err: any) {
      const msg = err?.message || 'Failed to parse project file.';
      setFileError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.dip'] },
    maxFiles: 1,
  });

  const handleConfirmLoad = () => {
    if (!preview) return;
    dispatch({ type: 'LOAD_PROJECT', payload: preview });
    showToast(`Project "${preview.projectName}" restored successfully!`, 'success');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          maxWidth: 480,
          width: '100%',
          padding: 28,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-800">Load Project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={22} />
          </button>
        </div>

        {!preview ? (
          <>
            {/* Drop zone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              <input {...getInputProps()} />
              {isLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <svg className="animate-spin h-10 w-10 text-blue-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-blue-600 font-medium">Reading project file…</p>
                </div>
              ) : (
                <>
                  <Upload size={40} className="text-blue-400 mx-auto mb-3" />
                  <p className="text-gray-700 font-medium">Drop your .dip file here</p>
                  <p className="text-gray-500 text-sm mt-1">or click to browse</p>
                  <p className="text-xs text-gray-400 mt-3">Only .dip (DataInsight Project) files are accepted</p>
                </>
              )}
            </div>

            {/* Error */}
            {fileError && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{fileError}</p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Preview */}
            <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={20} className="text-green-600" />
                <span className="font-semibold text-green-800">Valid project file detected</span>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-gray-500">Project Name</dt>
                <dd className="font-medium text-gray-800">{preview.projectName}</dd>
                <dt className="text-gray-500">Created</dt>
                <dd className="font-medium text-gray-800">
                  {new Date(preview.createdAt).toLocaleDateString()}
                </dd>
                <dt className="text-gray-500">Rows</dt>
                <dd className="font-medium text-gray-800">
                  {preview.processedDataset?.rows.length.toLocaleString() ?? '—'}
                </dd>
                <dt className="text-gray-500">Columns</dt>
                <dd className="font-medium text-gray-800">
                  {preview.processedDataset?.columns.length ?? '—'}
                </dd>
                <dt className="text-gray-500">History Steps</dt>
                <dd className="font-medium text-gray-800">{preview.history.length}</dd>
                <dt className="text-gray-500">ML Results</dt>
                <dd className="font-medium text-gray-800">{preview.mlResults.length}</dd>
                <dt className="text-gray-500">Saved Charts</dt>
                <dd className="font-medium text-gray-800">{preview.charts.length}</dd>
              </dl>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <p className="text-sm text-amber-800">
                ⚠ Loading this project will <strong>replace your current session</strong>. Make sure you've saved any work first.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPreview(null)}
                className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLoad}
                className="flex-1 py-2.5 px-4 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition-colors"
              >
                Restore Project
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoadProjectDropzone;
