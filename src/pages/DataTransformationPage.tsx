import React, { useState } from 'react';
import { Dataset, DataTransformation } from '../types';
import DataTransformationComponent from '../components/DataTransformation';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';

interface DataTransformationPageProps {
  dataset: Dataset;
  onDatasetUpdate?: (dataset: Dataset) => void;
}

const DataTransformationPage: React.FC<DataTransformationPageProps> = ({ 
  dataset, 
  onDatasetUpdate 
}) => {
  const [transformations, setTransformations] = useState<DataTransformation[]>([]);
  const { dispatch } = useProject();
  const { showToast } = useToast();

  const handleTransformation = (transformation: DataTransformation) => {
    setTransformations(prev => [transformation, ...prev]);
    
    // Apply transformation to dataset 
    const updatedDataset: Dataset = {
      ...dataset,
      rows: transformation.transformedData,
      columns: dataset.columns.map(col => {
        if (transformation.columns.includes(col.name)) {
          return col;
        }
        return col;
      }),
      dateModified: new Date(),
    };

    if (onDatasetUpdate) {
      onDatasetUpdate(updatedDataset);
    }

    // Log action to project history
    dispatch({
      type: 'LOG_WORKFLOW_STEP',
      payload: {
        action: 'transformation',
        description: `${transformation.type} applied to: ${transformation.columns.join(', ')}`,
        parameters: {
          transformationType: transformation.type,
          method: transformation.method,
          parameters: transformation.parameters,
        },
        affectedColumns: transformation.columns,
        datasetSnapshot: updatedDataset,
      },
    });
    showToast(`${transformation.type} transformation applied!`, 'success');
  };

  return (
    <div className="space-y-6">
      <DataTransformationComponent 
        dataset={dataset} 
        onTransformation={handleTransformation}
      />
      
      {/* Transformation History */}
      {transformations.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">Transformation History</h3>
            <p className="text-sm text-gray-500">Applied transformations and their effects</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {transformations.map((transformation) => (
                <div key={transformation.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800">
                      {transformation.type.charAt(0).toUpperCase() + transformation.type.slice(1)} Transformation
                    </h4>
                    <span className="text-sm text-gray-500">
                      Applied {new Date(transformation.id.split('-')[1]).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Method</p>
                      <p className="font-medium">{transformation.method}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Columns</p>
                      <p className="font-medium">{transformation.columns.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Original Rows</p>
                      <p className="font-medium">{transformation.originalData.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Transformed Rows</p>
                      <p className="font-medium">{transformation.transformedData.length}</p>
                    </div>
                  </div>
                  
                  {Object.keys(transformation.parameters).length > 0 && (
                    <div className="mt-3">
                      <p className="text-gray-500 text-sm mb-1">Parameters:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(transformation.parameters).map(([key, value]) => (
                          <span key={key} className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTransformationPage;
