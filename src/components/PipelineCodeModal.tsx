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
    // Generate script based off the workflow timeline
    const pyCode = generatePythonPipeline(
      state.projectName,
      currentDataset?.originalFilename || 'dataset.csv',
      state.workflowHistory
    );
    setCode(pyCode);
  }, [state, currentDataset]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('Pipeline code copied to clipboard!', 'success');
    } catch {
      showToast('Failed to copy code.', 'error');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const safeName = state.projectName.replace(/\s+/g, '_').toLowerCase();
    link.download = `${safeName}_pipeline.py`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
    showToast('Python script downloaded!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-[#1e1e1e] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-700">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#252526] rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500 bg-opacity-20 flex-shrink-0">
              <Code size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                Export to Python (Pandas)
              </h2>
              <p className="text-xs text-gray-400">Automate your visual data workflow as a reproducible pipeline.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto bg-[#1e1e1e] p-6 text-sm relative">
          <pre className="font-mono text-gray-300 whitespace-pre-wrap">
            <code className="language-python">{code}</code>
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#252526] border-t border-gray-800 rounded-b-xl">
          <p className="text-xs text-gray-400">
            Dependencies required:<span className="font-mono text-gray-300 ml-1 bg-gray-800 px-1 py-0.5 rounded">pandas</span>
            <span className="font-mono text-gray-300 ml-1 bg-gray-800 px-1 py-0.5 rounded">numpy</span>
            <span className="font-mono text-gray-300 ml-1 bg-gray-800 px-1 py-0.5 rounded">scikit-learn</span>
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-600 text-gray-200 rounded-lg hover:bg-gray-700 transition"
            >
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy Code'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-500 transition"
            >
              <Download size={16} />
              Download .py script
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineCodeModal;
