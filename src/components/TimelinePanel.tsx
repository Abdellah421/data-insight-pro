import React from 'react';
import { Clock, Undo, Redo, FastForward, CheckCircle, Database } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

interface TimelinePanelProps {
  onClose: () => void;
}

const TimelinePanel: React.FC<TimelinePanelProps> = ({ onClose }) => {
  const { state, dispatch } = useProject();

  const handleUndo = () => dispatch({ type: 'UNDO_STEP' });
  const handleRedo = () => dispatch({ type: 'REDO_STEP' });
  const handleJump = (index: number) => dispatch({ type: 'JUMP_TO_STEP', payload: index });

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-xl border-l border-gray-200 flex flex-col z-50 transition-transform">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold flex items-center gap-2 text-gray-800">
          <Clock size={18} className="text-blue-500" />
          Workflow Timeline
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">Close</button>
      </div>

      {/* Undo / Redo Toolbar */}
      <div className="flex justify-around p-3 border-b border-gray-100 bg-white">
        <button
          onClick={handleUndo}
          disabled={state.historyIndex < 0}
          className={`flex flex-col items-center gap-1 text-xs font-medium px-4 py-2 rounded-lg ${
            state.historyIndex < 0 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Undo size={16} /> Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={state.historyIndex >= state.workflowHistory.length - 1}
          className={`flex flex-col items-center gap-1 text-xs font-medium px-4 py-2 rounded-lg ${
            state.historyIndex >= state.workflowHistory.length - 1 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Redo size={16} /> Redo
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Origin Step */}
        <div className="relative">
          <div className="absolute left-3.5 top-5 bottom-[-20px] w-[2px] bg-gray-200"></div>
          <div
            onClick={() => handleJump(-1)}
            className={`cursor-pointer rounded-lg p-3 border transition-colors relative z-10 ${
              state.historyIndex === -1 ? 'bg-blue-50 border-blue-400 shadow-sm' : 'bg-white border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white ${state.historyIndex === -1 ? 'bg-blue-500' : 'bg-gray-400'}`}>
                <Database size={14} />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-800">Original Dataset</p>
                <p className="text-xs text-gray-500">Initial State</p>
              </div>
            </div>
            {state.historyIndex === -1 && <span className="absolute top-3 right-3 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>}
          </div>
        </div>

        {/* Dynamic Workflow Steps */}
        {state.workflowHistory.map((step, index) => {
          const isActive = state.historyIndex === index;
          const isFuture = index > state.historyIndex;
          return (
            <div key={step.id} className="relative">
              {index !== state.workflowHistory.length - 1 && (
                <div className="absolute left-3.5 top-5 bottom-[-20px] w-[2px] bg-gray-200"></div>
              )}
              <div
                onClick={() => handleJump(index)}
                className={`cursor-pointer rounded-lg p-3 border transition-colors relative z-10 ${
                  isActive ? 'bg-blue-50 border-blue-400 shadow-sm' : isFuture ? 'bg-gray-50 border-dashed border-gray-300 opacity-60' : 'bg-white border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
                    isActive ? 'bg-blue-500' : isFuture ? 'bg-gray-300' : 'bg-green-500'
                  }`}>
                    {isActive ? <FastForward size={14} /> : isFuture ? <div className="w-1.5 h-1.5 rounded-full bg-white"/> : <CheckCircle size={14} />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-800 capitalize leading-tight">{step.action.replace('_', ' ')}</h4>
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 pl-10 mb-1 leading-snug">{step.description}</p>
                {step.affectedColumns && step.affectedColumns.length > 0 && (
                  <p className="text-xs text-gray-400 pl-10">Columns: {step.affectedColumns.join(', ')}</p>
                )}

                {isActive && <span className="absolute top-3 right-3 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>}
              </div>
            </div>
          );
        })}

        {state.workflowHistory.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-500">
            No actions logged yet. Start cleaning or transforming your data!
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelinePanel;
