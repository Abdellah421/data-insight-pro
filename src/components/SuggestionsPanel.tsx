import React, { useMemo } from 'react';
import { Lightbulb, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

interface SuggestionsPanelProps {
  onClose: () => void;
}

export const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({ onClose }) => {
  const { currentDataset } = useProject();

  const suggestions = useMemo(() => {
    if (!currentDataset) return [];
    
    let items = [];
    currentDataset.columns.forEach(col => {
      // Missing value suggestion
      if (col.missingPercent !== undefined && col.missingPercent > 5) {
        items.push({
          id: `miss-${col.name}`,
          type: 'warning',
          title: `High Missing Values in "${col.name}"`,
          desc: `Column "${col.name}" contains ${col.missingPercent.toFixed(1)}% missing values. Suggested fix: Median replacement or drop rows.`,
        });
      }
      // Datatype mismatch suggestion
      if (col.type === 'unknown' || col.type === 'string') {
        const numericLike = currentDataset.rows.slice(0, 10).every(row => {
           const val = row[col.name];
           return val !== null && val !== '' && !isNaN(Number(val));
        });
        if (numericLike) {
            items.push({
              id: `type-${col.name}`,
              type: 'info',
              title: `Potential Datatype Mismatch in "${col.name}"`,
              desc: `"${col.name}" is classified as string but contains numeric data. Suggested fix: Cast to numeric.`,
            });
        }
      }
    });

    if (items.length === 0) {
      items.push({
        id: 'all-good',
        type: 'success',
        title: 'Dataset Looks Clean',
        desc: 'No major missing values or immediate anomaly detected automatically.',
      });
    }

    return items;
  }, [currentDataset]);

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-xl border-l border-gray-200 flex flex-col z-50 transition-transform">
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0 bg-yellow-50 border-yellow-100">
        <h3 className="font-semibold flex items-center gap-2 text-yellow-800">
          <Lightbulb size={18} className="text-yellow-600" />
          Smart Suggestions
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">Close</button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!currentDataset ? (
          <p className="text-sm text-gray-500 text-center mt-10">Load a dataset to see smart suggestions.</p>
        ) : (
          suggestions.map((s: any) => (
            <div key={s.id} className={`p-4 rounded-lg border ${
              s.type === 'warning' ? 'bg-amber-50 border-amber-200' :
              s.type === 'success' ? 'bg-green-50 border-green-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {s.type === 'warning' ? <AlertTriangle size={18} className="text-amber-500" /> :
                   s.type === 'success' ? <CheckCircle size={18} className="text-green-500" /> :
                   <Info size={18} className="text-blue-500" />}
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${
                    s.type === 'warning' ? 'text-amber-800' :
                    s.type === 'success' ? 'text-green-800' :
                    'text-blue-800'
                  }`}>{s.title}</h4>
                  <p className="text-xs mt-1 text-gray-600 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SuggestionsPanel;
