import React, { useState } from 'react';
import { Brain, Users, Lightbulb, AlertCircle, Sparkles } from 'lucide-react';
import { Dataset, MLResultEntry } from '../types';
import { Scatter } from 'react-chartjs-2';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MLAnalysisProps {
  dataset: Dataset;
}

interface MLResult {
  id: string;
  type: 'clustering' | 'regression' | 'classification' | 'insights';
  title: string;
  description: string;
  data: any;
  accuracy?: number;
  predictions?: any[];
  clusters?: any[];
  insights?: string[];
  dateCreated: Date;
}

const MLAnalysis: React.FC<MLAnalysisProps> = ({ dataset }) => {
  const { dispatch } = useProject();
  const { showToast } = useToast();
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>('insights');

  const [featureColumns, setFeatureColumns] = useState<string[]>([]);
  const [mlResults, setMlResults] = useState<MLResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [numClusters, setNumClusters] = useState(3);
  
  // Get numeric columns for ML analysis
  const numericColumns = dataset.columns
    .filter(col => col.type === 'number')
    .map(col => col.name);
  
  // Get categorical columns
  const categoricalColumns = dataset.columns
    .filter(col => col.type === 'string' || col.type === 'boolean')
    .map(col => col.name);
  
  // Generate automated insights
  const generateInsights = async () => {
    setLoading(true);
    
    try {
      const insights: string[] = [];
      
      // Analyze data quality
      const totalCells = dataset.rows.length * dataset.columns.length;
      const missingCells = dataset.columns.reduce((total, col) => total + (col.missing || 0), 0);
      const missingPercent = (missingCells / totalCells) * 100;
      
      if (missingPercent > 20) {
        insights.push(`High missing data rate (${missingPercent.toFixed(1)}%). Consider data imputation or removal of incomplete records.`);
      } else if (missingPercent > 5) {
        insights.push(`Moderate missing data (${missingPercent.toFixed(1)}%). Data cleaning recommended.`);
      } else {
        insights.push(`Good data quality with low missing values (${missingPercent.toFixed(1)}%).`);
      }
      
      // Analyze numeric columns
      const numericStats = dataset.columns
        .filter(col => col.type === 'number')
        .map(col => ({
          name: col.name,
          mean: col.mean,
          std: col.std,
          min: col.min,
          max: col.max,
        }));
      
      // Find potential outliers
      numericStats.forEach(stat => {
        if (stat.std && stat.mean) {
          const zScoreThreshold = 3;
          const outlierThreshold = stat.mean + (zScoreThreshold * stat.std);
          const outlierCount = dataset.rows.filter(row => 
            row[stat.name] > outlierThreshold
          ).length;
          
          if (outlierCount > 0) {
            insights.push(`Potential outliers detected in ${stat.name}: ${outlierCount} values exceed ${outlierThreshold.toFixed(2)}.`);
          }
        }
      });
      
      // Analyze correlations
      if (numericStats.length >= 2) {
        const correlations: { col1: string; col2: string; correlation: number }[] = [];
        
        for (let i = 0; i < numericStats.length; i++) {
          for (let j = i + 1; j < numericStats.length; j++) {
            const col1 = numericStats[i].name;
            const col2 = numericStats[j].name;
            
            const values1 = dataset.rows.map(row => row[col1]).filter(v => typeof v === 'number');
            const values2 = dataset.rows.map(row => row[col2]).filter(v => typeof v === 'number');
            
            if (values1.length > 0 && values2.length > 0) {
              const correlation = calculateCorrelation(values1, values2);
              if (Math.abs(correlation) > 0.7) {
                correlations.push({ col1, col2, correlation });
              }
            }
          }
        }
        
        if (correlations.length > 0) {
          const topCorrelation = correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))[0];
          insights.push(`Strong correlation found between ${topCorrelation.col1} and ${topCorrelation.col2} (${topCorrelation.correlation.toFixed(3)}).`);
        }
      }
      
      // Analyze categorical columns
      categoricalColumns.forEach(colName => {
        const values = dataset.rows.map(row => row[colName]).filter(v => v !== null && v !== undefined);
        const mostCommon = values.reduce((acc, val) => {
          acc[val] = (acc[val] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const maxCount = Math.max(...(Object.values(mostCommon) as number[]));
        const totalCount = values.length;
        const dominance = (maxCount / totalCount) * 100;
        
        if (dominance > 80) {
          insights.push(`High class imbalance in ${colName}: one category dominates (${dominance.toFixed(1)}%).`);
        }
      });
      
      // Dataset size insights
      if (dataset.rows.length < 100) {
        insights.push(`Small dataset (${dataset.rows.length} rows). Consider collecting more data for robust ML models.`);
      } else if (dataset.rows.length > 10000) {
        insights.push(`Large dataset (${dataset.rows.length} rows). Consider sampling for faster analysis.`);
      }
      
      // Feature engineering suggestions
      if (numericStats.length > 0) {
        insights.push(`Consider feature engineering: create ratios, differences, or polynomial features from numeric columns.`);
      }
      
      const result: MLResult = {
        id: `insights-${Date.now()}`,
        type: 'insights',
        title: 'Automated Data Insights',
        description: 'AI-generated insights about your dataset',
        data: { insights },
        dateCreated: new Date(),
      };
      
      setMlResults(prev => [result, ...prev]);

      // Push to project context
      const mlEntry: MLResultEntry = {
        id: result.id,
        type: 'insights',
        title: result.title,
        description: result.description,
        data: result.data,
        dateCreated: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_ML_RESULT', payload: mlEntry });
      dispatch({
        type: 'LOG_ACTION',
        payload: {
          action: 'ml_insights',
          description: `Generated ${insights.length} AI insights`,
          details: { insightCount: insights.length },
          timestamp: Date.now(),
        },
      });
      showToast(`${insights.length} AI insights generated!`, 'success');
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate correlation coefficient
  const calculateCorrelation = (x: number[], y: number[]): number => {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;
    
    const xMean = x.reduce((sum, val) => sum + val, 0) / n;
    const yMean = y.reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let xDenominator = 0;
    let yDenominator = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = y[i] - yMean;
      numerator += xDiff * yDiff;
      xDenominator += xDiff * xDiff;
      yDenominator += yDiff * yDiff;
    }
    
    const correlation = numerator / Math.sqrt(xDenominator * yDenominator);
    return isNaN(correlation) ? 0 : correlation;
  };
  
  // Perform clustering analysis
  const performClustering = async () => {
    if (featureColumns.length === 0) return;
    
    setLoading(true);
    
    try {
      // Prepare data for clustering
      const clusterData = dataset.rows
        .map(row => featureColumns.map(col => row[col]))
        .filter(row => row.every(val => val !== null && val !== undefined && !isNaN(val)));
      
      if (clusterData.length === 0) {
        throw new Error('No valid data for clustering');
      }
      
      // Simple k-means clustering implementation
      const clusters = performKMeans(clusterData, numClusters);
      
      const result: MLResult = {
        id: `clustering-${Date.now()}`,
        type: 'clustering',
        title: `K-Means Clustering (${numClusters} clusters)`,
        description: `Clustered data using ${featureColumns.join(', ')} as features`,
        data: {
          clusters,
          featureColumns,
          numClusters,
        },
        dateCreated: new Date(),
      };
      
      setMlResults(prev => [result, ...prev]);

      // Push to project context
      const mlEntry: MLResultEntry = {
        id: result.id,
        type: 'clustering',
        title: result.title,
        description: result.description,
        data: result.data,
        dateCreated: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_ML_RESULT', payload: mlEntry });
      dispatch({
        type: 'LOG_ACTION',
        payload: {
          action: 'ml_clustering',
          description: `K-Means clustering with ${numClusters} clusters on ${featureColumns.join(', ')}`,
          details: { numClusters, featureColumns, iterations: clusters.iterations },
          timestamp: Date.now(),
        },
      });
      showToast(`Clustering complete: ${numClusters} clusters found!`, 'success');
    } catch (error) {
      console.error('Error performing clustering:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Simple k-means implementation
  const performKMeans = (data: number[][], k: number) => {
    // Initialize centroids randomly
    let centroids = Array.from({ length: k }, () => {
      const centroid = [];
      for (let i = 0; i < data[0].length; i++) {
        const values = data.map(row => row[i]);
        const min = Math.min(...values);
        const max = Math.max(...values);
        centroid.push(min + Math.random() * (max - min));
      }
      return centroid;
    });
    
    let assignments = new Array(data.length).fill(0);
    let changed = true;
    let iterations = 0;
    const maxIterations = 100;
    
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      
      // Assign points to nearest centroid
      for (let i = 0; i < data.length; i++) {
        let minDistance = Infinity;
        let bestCluster = 0;
        
        for (let j = 0; j < k; j++) {
          const distance = euclideanDistance(data[i], centroids[j]);
          if (distance < minDistance) {
            minDistance = distance;
            bestCluster = j;
          }
        }
        
        if (assignments[i] !== bestCluster) {
          assignments[i] = bestCluster;
          changed = true;
        }
      }
      
      // Update centroids
      for (let j = 0; j < k; j++) {
        const clusterPoints = data.filter((_, i) => assignments[i] === j);
        if (clusterPoints.length > 0) {
          centroids[j] = clusterPoints[0].map((_, dim) => 
            clusterPoints.reduce((sum, point) => sum + point[dim], 0) / clusterPoints.length
          );
        }
      }
    }
    
    return {
      assignments,
      centroids,
      iterations,
    };
  };
  
  // Calculate Euclidean distance
  const euclideanDistance = (a: number[], b: number[]): number => {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  };
  
  // Render clustering results
  const renderClusteringChart = (result: MLResult) => {
    const { data } = result;
    
    if (data.featureColumns.length !== 2) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">{result.title}</h3>
          <p className="text-gray-600">
            Clustering completed with {data.numClusters} clusters using {data.featureColumns.join(', ')} features.
          </p>
          <div className="mt-4">
            <h4 className="font-medium text-gray-700">Cluster Distribution</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
              {Array.from({ length: data.numClusters }, (_, i) => {
                const clusterSize = data.clusters.assignments.filter((assignment: any) => assignment === i).length;
                return (
                  <div key={i} className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">{clusterSize}</div>
                    <div className="text-sm text-gray-600">Cluster {i + 1}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
    
    // Create scatter plot for 2D visualization
    const chartData = {
      datasets: Array.from({ length: data.numClusters }, (_, i) => {
        const clusterPoints = dataset.rows
          .map((row, index) => ({
            x: row[data.featureColumns[0]],
            y: row[data.featureColumns[1]],
            cluster: data.clusters.assignments[index],
          }))
          .filter(point => point.cluster === i && point.x !== null && point.y !== null);
        
        const colors = [
          'rgba(37, 99, 235, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(220, 38, 38, 0.7)',
          'rgba(139, 92, 246, 0.7)',
        ];
        
        return {
          label: `Cluster ${i + 1}`,
          data: clusterPoints.map(point => ({ x: point.x, y: point.y })),
          backgroundColor: colors[i % colors.length],
          borderColor: colors[i % colors.length].replace('0.7', '1'),
        };
      }),
    };
    
    const chartOptions = {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `Clustering Results - ${data.featureColumns[0]} vs ${data.featureColumns[1]}`,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: data.featureColumns[0],
          },
        },
        y: {
          title: {
            display: true,
            text: data.featureColumns[1],
          },
        },
      },
    };
    
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">{result.title}</h3>
        <div className="h-[400px]">
          <Scatter data={chartData} options={chartOptions} />
        </div>
        <div className="mt-4">
          <h4 className="font-medium text-gray-700">Cluster Information</h4>
          <p className="text-sm text-gray-600 mt-1">
            {data.clusters.iterations} iterations completed. Each cluster represents a group of similar data points.
          </p>
        </div>
      </div>
    );
  };
  
  // Render insights
  const renderInsights = (result: MLResult) => {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">{result.title}</h3>
        <div className="space-y-3">
          {result.data.insights.map((insight: any, index: number) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <Lightbulb size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">{insight}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Machine Learning Analysis</h2>
        <p className="text-gray-600">
          Apply ML algorithms and get AI-powered insights
        </p>
      </div>
      
      {/* Analysis type tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'insights', name: 'AI Insights', icon: <Lightbulb size={18} /> },
            { id: 'clustering', name: 'Clustering', icon: <Users size={18} /> },
            { id: 'results', name: 'ML Results', icon: <Brain size={18} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedAnalysis(tab.id)}
              className={`flex items-center pb-4 px-1 ${
                selectedAnalysis === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Analysis content */}
      <div>
        {/* AI Insights */}
        {selectedAnalysis === 'insights' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800">AI-Powered Insights</h3>
                  <p className="text-sm text-gray-500">Get automated analysis of your data</p>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">What AI will analyze:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Data quality and missing values</li>
                      <li>• Outliers and anomalies</li>
                      <li>• Correlations between variables</li>
                      <li>• Class imbalance in categorical data</li>
                      <li>• Dataset size recommendations</li>
                      <li>• Feature engineering suggestions</li>
                    </ul>
                  </div>
                  
                  <button
                    onClick={generateInsights}
                    disabled={loading}
                    className={`w-full flex items-center justify-center py-3 px-4 rounded-md font-medium ${
                      loading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} className="mr-2" />
                        Generate AI Insights
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-2">
              {mlResults
                .filter(result => result.type === 'insights')
                .slice(0, 1)
                .map(result => (
                  <div key={result.id}>
                    {renderInsights(result)}
                  </div>
                ))}
              
              {mlResults.filter(result => result.type === 'insights').length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <Lightbulb size={64} className="text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-800 mb-2">No AI Insights Yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Click "Generate AI Insights" to get automated analysis of your dataset.
                    The AI will examine data quality, patterns, and provide recommendations.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Clustering Analysis */}
        {selectedAnalysis === 'clustering' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800">K-Means Clustering</h3>
                  <p className="text-sm text-gray-500">Group similar data points together</p>
                </div>
                
                <div className="p-6 space-y-4">
                  {numericColumns.length < 2 ? (
                    <div className="flex items-center p-4 bg-amber-50 text-amber-700 rounded-lg">
                      <AlertCircle size={20} className="mr-2 flex-shrink-0" />
                      <p>You need at least two numeric columns for clustering</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Features (2-4 recommended)
                        </label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {numericColumns.map(column => (
                            <label key={column} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={featureColumns.includes(column)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFeatureColumns(prev => [...prev, column]);
                                  } else {
                                    setFeatureColumns(prev => prev.filter(col => col !== column));
                                  }
                                }}
                                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                              />
                              <span className="text-sm text-gray-700">{column}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="num-clusters" className="block text-sm font-medium text-gray-700 mb-1">
                          Number of Clusters
                        </label>
                        <input
                          id="num-clusters"
                          type="number"
                          min="2"
                          max="10"
                          value={numClusters}
                          onChange={(e) => setNumClusters(parseInt(e.target.value) || 3)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <button
                        onClick={performClustering}
                        disabled={featureColumns.length === 0 || loading}
                        className={`w-full flex items-center justify-center py-3 px-4 rounded-md font-medium ${
                          featureColumns.length === 0 || loading
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Clustering...
                          </>
                        ) : 'Perform Clustering'}
                      </button>
                      
                      <div className="bg-blue-50 rounded-lg p-4 text-sm">
                        <h4 className="font-medium text-blue-800 mb-2">About Clustering</h4>
                        <p className="text-blue-700">
                          K-means clustering groups similar data points together. 
                          Choose 2-4 numeric features for best results. 
                          The algorithm will find natural groupings in your data.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-2">
              {mlResults
                .filter(result => result.type === 'clustering')
                .slice(0, 1)
                .map(result => (
                  <div key={result.id}>
                    {renderClusteringChart(result)}
                  </div>
                ))}
              
              {mlResults.filter(result => result.type === 'clustering').length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <Users size={64} className="text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-800 mb-2">No Clustering Results Yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Select numeric features and run clustering to discover groups in your data.
                    This can help identify patterns and segments in your dataset.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* ML Results */}
        {selectedAnalysis === 'results' && (
          <div>
            {mlResults.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {mlResults.map(result => (
                  <div key={result.id}>
                    {result.type === 'insights' && renderInsights(result)}
                    {result.type === 'clustering' && renderClusteringChart(result)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Brain size={64} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-800 mb-2">No ML Results Yet</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Run AI insights or clustering analysis to generate machine learning results.
                  Results will appear here for easy reference and comparison.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MLAnalysis; 