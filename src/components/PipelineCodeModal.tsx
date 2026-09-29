import React, { useState, useEffect } from 'react';
import { X, Copy, Download, Code, Check } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import { generatePythonPipeline } from '../utils/codeGenerator';

interface PipelineCodeModalProps {
  onClose: () => void;
}

const PipelineCodeModal: React.FC<PipelineCodeModalProps> = ({ onClose }) => {
  const { state, currentDataset } = useProject();
  const { showToast } = useToast();
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const pyCode = generatePythonPipeline(
      state.projectName,
      currentDataset?.originalFilename || 'dataset.csv',
      state.workflowHistory
    );
    setCode(pyCode);
  }, [state, currentDataset]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
      } else {
        // Fallback for older browsers or non-HTTPS contexts in Edge/Firefox
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('Pipeline code copied to clipboard!', 'success');
    } catch {
      showToast('Failed to copy code.', 'error');
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([code], { type: 'text/x-python;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const safeName = state.projectName.replace(/\s+/g, '_').toLowerCase();
      link.download = `${safeName}_pipeline.py`;
      link.href = url;
      link.click();
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('Python script downloaded!', 'success');
    } catch (err: any) {
      showToast(`Download failed: ${err?.message}`, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-[#1e1e1e] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-700 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-800 bg-[#252526] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 flex-shrink-0">
              <Code size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-100 flex items-center gap-2">
                Export to Python (Pandas)
              </h2>
              <p className="text-xs text-gray-400">Automate your visual data workflow as a reproducible pipeline.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto bg-[#1e1e1e] p-4 sm:p-6 text-xs sm:text-sm relative">
          <pre className="font-mono text-gray-300 whitespace-pre-wrap leading-relaxed">
            <code className="language-python">{code}</code>
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-4 sm:px-6 py-4 bg-[#252526] border-t border-gray-800 gap-3 flex-shrink-0">
          <p className="text-xs text-gray-400">
            Dependencies:<span className="font-mono text-gray-300 ml-1 bg-gray-800 px-1.5 py-0.5 rounded">pandas</span>
            <span className="font-mono text-gray-300 ml-1 bg-gray-800 px-1.5 py-0.5 rounded">numpy</span>
            <span className="font-mono text-gray-300 ml-1 bg-gray-800 px-1.5 py-0.5 rounded">scikit-learn</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold border border-gray-600 text-gray-200 rounded-xl hover:bg-gray-700 transition min-h-[44px]"
            >
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy Code'}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-500 transition min-h-[44px]"
            >
              <Download size={16} />
              Download Script
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineCodeModal;
