import React, { useState } from 'react';
import { BarChart2, PieChart, Gauge, TrendingUp, AlertCircle } from 'lucide-react';
import { Dataset, AnalysisResult } from '../types';
import StatsCard from '../components/StatsCard';
import CorrelationHeatmap from '../components/CorrelationHeatmap';
import { Bar, Pie, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
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
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DataAnalysisProps {
  dataset: Dataset;
}

const DataAnalysis: React.FC<DataAnalysisProps> = ({ dataset }) => {
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>('summary');
  const [correlationTarget, setCorrelationTarget] = useState<string>('');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Debug logging
  React.useEffect(() => {
    console.log('DataAnalysis: Dataset updated', {
      rows: dataset.rows.length,
      columns: dataset.columns.length,
      columnTypes: dataset.columns.map(c => ({ name: c.name, type: c.type }))
    });
  }, [dataset]);
  
  // List of numeric columns for correlation analysis
  const numericColumns = dataset.columns
    .filter(col => col.type === 'number')
    .map(col => col.name);
  
  // Get summary statistics for all columns
  const summaryStats = React.useMemo(() => {
    return dataset.columns.map(column => {
      const values = dataset.rows
        .map(row => row[column.name])
        .filter(val => val !== null && val !== undefined && val !== '');
      
      let stats: any = {
        name: column.name,
        type: column.type,
        count: values.length,
        missing: dataset.rows.length - values.length,
        missingPercent: ((dataset.rows.length - values.length) / dataset.rows.length) * 100,
      };
      
      if (column.type === 'number' && values.length > 0) {
        // Calculate numeric stats
        stats.min = Math.min(...values);
        stats.max = Math.max(...values);
        stats.mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        
        // Sort values for median
        const sortedValues = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sortedValues.length / 2);
        stats.median = sortedValues.length % 2 === 0
          ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
          : sortedValues[mid];
        
        // Standard deviation
        const variance = values.reduce((sum, val) => 
          sum + Math.pow(val - stats.mean, 2), 0) / values.length;
        stats.std = Math.sqrt(variance);
      }
      
      // Count unique values (for any type)
      const uniqueValues = new Set(values);
      stats.uniqueValues = uniqueValues.size;
      stats.uniquePercent = (uniqueValues.size / Math.max(1, values.length)) * 100;
      
      return stats;
    });
  }, [dataset]);

  // Calculate correlations with target column
  const calculateCorrelations = () => {
    if (!correlationTarget || numericColumns.length < 2) {
      console.warn('Cannot calculate correlations: insufficient data');
      return;
    }
    
    setLoading(true);
    
    try {
      // Get target column values and filter out non-numeric and null values
      const targetValues = dataset.rows
        .map(row => row[correlationTarget])
        .filter(val => typeof val === 'number' && val !== null);
      
      // Calculate correlation for each numeric column
      const correlations = numericColumns
        .filter(colName => colName !== correlationTarget)
        .map(colName => {
          // Get column values and filter out non-numeric and null values
          const colValues = dataset.rows
            .map(row => row[colName])
            .filter(val => typeof val === 'number' && val !== null);
          
          // Only calculate if we have enough data points
          if (colValues.length < 2) return null;
          
          // Calculate means
          const xMean = targetValues.reduce((sum, val) => sum + val, 0) / targetValues.length;
          const yMean = colValues.reduce((sum, val) => sum + val, 0) / colValues.length;
          
          // Calculate correlation coefficient
          let numerator = 0;
          let xDenominator = 0;
          let yDenominator = 0;
          
          for (let i = 0; i < Math.min(targetValues.length, colValues.length); i++) {
            const xDiff = targetValues[i] - xMean;
            const yDiff = colValues[i] - yMean;
            numerator += xDiff * yDiff;
            xDenominator += xDiff * xDiff;
            yDenominator += yDiff * yDiff;
          }
          
          const correlation = numerator / Math.sqrt(xDenominator * yDenominator);
          
          return {
            column: colName,
            correlation: isNaN(correlation) ? 0 : correlation,
            strength: Math.abs(isNaN(correlation) ? 0 : correlation),
            direction: correlation >= 0 ? 'positive' : 'negative',
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.strength - a.strength);
      
      // Create an analysis result
      const result: AnalysisResult = {
        id: `correlation-${Date.now()}`,
        type: 'correlation',
        title: `Correlation with ${correlationTarget}`,
        description: 'Pearson correlation coefficients between variables',
        data: {
          targetColumn: correlationTarget,
          correlations,
        },
        dateCreated: new Date(),
        visualizationOptions: {
          type: 'bar',
          xAxis: 'column',
          yAxis: 'correlation',
        },
      };
      
      setAnalysisResults(prev => [result, ...prev]);
    } catch (error) {
      console.error('Error calculating correlations:', error);
      alert('Error calculating correlations. Please check your data and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Run a distribution analysis on a column
  const runDistributionAnalysis = (columnName: string) => {
    const column = dataset.columns.find(col => col.name === columnName);
    if (!column) {
      console.warn(`Column ${columnName} not found`);
      return;
    }
    
    setLoading(true);
    
    try {
      if (column.type === 'number') {
        // For numeric columns, create a histogram
        const values = dataset.rows
          .map(row => row[columnName])
          .filter(val => val !== null && val !== undefined && val !== '');
        
        if (values.length === 0) {
          console.warn(`No valid numeric values found for column ${columnName}`);
          setLoading(false);
          return;
        }
        
        // Determine bin count (Sturges' formula)
        const binCount = Math.ceil(Math.log2(values.length) + 1);
        
        // Calculate min and max
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        // Create bins
        const binWidth = (max - min) / binCount;
        const bins = Array(binCount).fill(0);
        const binRanges = Array(binCount)
          .fill(0)
          .map((_, i) => min + i * binWidth);
        
        // Count values in each bin
        values.forEach(val => {
          if (val === max) {
            // Edge case: max value goes in the last bin
            bins[binCount - 1]++;
          } else {
            const binIndex = Math.floor((val - min) / binWidth);
            bins[binIndex]++;
          }
        });
        
        // Create analysis result
        const result: AnalysisResult = {
          id: `distribution-${Date.now()}`,
          type: 'distribution',
          title: `Distribution of ${columnName}`,
          description: 'Histogram showing the distribution of values',
          data: {
            columnName,
            columnType: 'number',
            bins,
            binRanges: binRanges.map((start, i) => ({
              start,
              end: i < binCount - 1 ? binRanges[i + 1] : max,
            })),
            min,
            max,
            count: values.length,
          },
          dateCreated: new Date(),
          visualizationOptions: {
            type: 'bar',
          },
        };
        
        setAnalysisResults(prev => [result, ...prev]);
      } else {
        // For categorical columns, count frequencies
        const valueMap = new Map<string, number>();
        
        dataset.rows.forEach(row => {
          const val = String(row[columnName] || '');
          if (val !== 'null' && val !== 'undefined' && val !== '') {
            valueMap.set(val, (valueMap.get(val) || 0) + 1);
          }
        });
        
        // Sort by frequency
        const sortedEntries = [...valueMap.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10); // Limit to top 10 categories
        
        // Create analysis result
        const result: AnalysisResult = {
          id: `distribution-${Date.now()}`,
          type: 'distribution',
          title: `Top Categories in ${columnName}`,
          description: 'Frequency of top categories',
          data: {
            columnName,
            columnType: 'category',
            categories: sortedEntries.map(([name]) => name),
            frequencies: sortedEntries.map(([_, count]) => count),
            total: dataset.rows.length,
          },
          dateCreated: new Date(),
          visualizationOptions: {
            type: 'pie',
          },
        };
        
        setAnalysisResults(prev => [result, ...prev]);
      }
    } catch (error) {
      console.error('Error running distribution analysis:', error);
      alert('Error running distribution analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Render correlation chart
  const renderCorrelationChart = (result: AnalysisResult) => {
    if (!result || !result.data || !result.data.correlations) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Error</h3>
          <p className="text-red-600">Unable to render correlation chart. Data may be corrupted.</p>
        </div>
      );
    }
    
    const { data } = result;
    
    const chartData = {
      labels: data.correlations.map((corr: any) => corr.column),
      datasets: [
        {
          label: 'Correlation',
          data: data.correlations.map((corr: any) => corr.correlation),
          backgroundColor: data.correlations.map((corr: any) => 
            corr.correlation >= 0 ? 'rgba(37, 99, 235, 0.6)' : 'rgba(220, 38, 38, 0.6)'
          ),
          borderColor: data.correlations.map((corr: any) => 
            corr.correlation >= 0 ? 'rgb(37, 99, 235)' : 'rgb(220, 38, 38)'
          ),
          borderWidth: 1,
        },
      ],
    };
    
    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: `Correlation with ${data.targetColumn}`,
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const value = context.raw;
              return `Correlation: ${value.toFixed(4)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          max: 1,
          min: -1,
        },
      },
    };
    
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">{result.title}</h3>
        <Bar data={chartData} options={chartOptions} height={300} />
        <div className="mt-4">
          <h4 className="font-medium text-gray-700">Interpretation</h4>
          <p className="text-sm text-gray-600 mt-1">
            Correlation values range from -1 to 1. Values close to 1 indicate a strong positive 
            correlation, values close to -1 indicate a strong negative correlation, and values 
            close to 0 indicate little to no linear correlation.
          </p>
          
          {data.correlations.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-700">Top Correlations</h4>
              <ul className="mt-2 space-y-2">
                {data.correlations.slice(0, 3).map((corr: any) => (
                  <li key={corr.column} className="text-sm">
                    <span className="font-medium">{corr.column}:</span> {corr.correlation.toFixed(4)} 
                    <span className="text-gray-500 ml-1">
                      ({corr.direction}, {
                        corr.strength > 0.7 ? 'strong' :
                        corr.strength > 0.3 ? 'moderate' : 'weak'
                      })
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render distribution chart
  const renderDistributionChart = (result: AnalysisResult) => {
    if (!result || !result.data) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Error</h3>
          <p className="text-red-600">Unable to render distribution chart. Data may be corrupted.</p>
        </div>
      );
    }
    
    const { data } = result;
    
    if (data.columnType === 'number') {
      // Render histogram for numeric data
      const chartData = {
        labels: data.binRanges.map((range: any, i: number) => 
          `${range.start.toFixed(1)} - ${range.end.toFixed(1)}`
        ),
        datasets: [
          {
            label: 'Frequency',
            data: data.bins,
            backgroundColor: 'rgba(37, 99, 235, 0.6)',
            borderColor: 'rgb(37, 99, 235)',
            borderWidth: 1,
          },
        ],
      };
      
      const chartOptions = {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: `Distribution of ${data.columnName}`,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Frequency',
            },
          },
          x: {
            title: {
              display: true,
              text: 'Value Range',
            },
          },
        },
      };
      
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">{result.title}</h3>
          <Bar data={chartData} options={chartOptions} height={300} />
          <div className="mt-4">
            <h4 className="font-medium text-gray-700">Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
              <div>
                <p className="text-sm text-gray-500">Min</p>
                <p className="font-medium">{data.min.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Max</p>
                <p className="font-medium">{data.max.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Count</p>
                <p className="font-medium">{data.count}</p>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      // Render pie chart for categorical data
      const chartData = {
        labels: data.categories,
        datasets: [
          {
            data: data.frequencies,
            backgroundColor: [
              'rgba(37, 99, 235, 0.6)',   // blue
              'rgba(245, 158, 11, 0.6)',  // amber
              'rgba(16, 185, 129, 0.6)',  // green
              'rgba(220, 38, 38, 0.6)',   // red
              'rgba(139, 92, 246, 0.6)',  // purple
              'rgba(236, 72, 153, 0.6)',  // pink
              'rgba(6, 182, 212, 0.6)',   // cyan
              'rgba(245, 158, 11, 0.6)',  // amber
              'rgba(16, 185, 129, 0.6)',  // green
              'rgba(220, 38, 38, 0.6)',   // red
            ],
            borderColor: [
              'rgb(37, 99, 235)',   // blue
              'rgb(245, 158, 11)',  // amber
              'rgb(16, 185, 129)',  // green
              'rgb(220, 38, 38)',   // red
              'rgb(139, 92, 246)',  // purple
              'rgb(236, 72, 153)',  // pink
              'rgb(6, 182, 212)',   // cyan
              'rgb(245, 158, 11)',  // amber
              'rgb(16, 185, 129)',  // green
              'rgb(220, 38, 38)',   // red
            ],
            borderWidth: 1,
          },
        ],
      };
      
      const chartOptions = {
        responsive: true,
        plugins: {
          legend: {
            position: 'right' as const,
          },
          title: {
            display: true,
            text: `Top Categories in ${data.columnName}`,
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const value = context.raw;
                const total = data.total;
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
      };
      
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">{result.title}</h3>
          <Pie data={chartData} options={chartOptions} height={300} />
          <div className="mt-4">
            <h4 className="font-medium text-gray-700">Top Categories</h4>
            <ul className="mt-2 space-y-1">
              {data.categories.slice(0, 5).map((category: string, index: number) => (
                <li key={category} className="text-sm flex justify-between">
                  <span className="truncate max-w-[200px]">{category}</span>
                  <span className="font-medium">
                    {data.frequencies[index]} 
                    <span className="text-gray-500 ml-1">
                      ({((data.frequencies[index] / data.total) * 100).toFixed(1)}%)
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Data Analysis</h2>
        <p className="text-gray-600">
          Analyze your data to uncover patterns and insights
        </p>
      </div>
      
      {/* Analysis type tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'summary', name: 'Summary Statistics', icon: <Gauge size={18} /> },
            { id: 'correlation', name: 'Correlation Analysis', icon: <TrendingUp size={18} /> },
            { id: 'heatmap', name: 'Correlation Heatmap', icon: <BarChart2 size={18} /> },
            { id: 'distribution', name: 'Distribution Analysis', icon: <BarChart2 size={18} /> },
            { id: 'results', name: 'Analysis Results', icon: <PieChart size={18} /> },
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
        {/* Summary Statistics */}
        {selectedAnalysis === 'summary' && (
          <div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-800">Summary Statistics</h3>
                <p className="text-sm text-gray-500">Overview of your dataset's columns</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Column
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Missing
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unique
                      </th>
                      {/* Show these headers only for numeric columns */}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Min
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Max
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mean
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Std
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {summaryStats.map((stat, index) => (
                      <tr key={stat.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {stat.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {stat.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stat.missingPercent.toFixed(1)}% ({stat.missing})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stat.uniqueValues} ({stat.uniquePercent.toFixed(1)}%)
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stat.type === 'number' && stat.min !== undefined
                            ? stat.min.toFixed(2)
                            : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stat.type === 'number' && stat.max !== undefined
                            ? stat.max.toFixed(2)
                            : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stat.type === 'number' && stat.mean !== undefined
                            ? stat.mean.toFixed(2)
                            : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stat.type === 'number' && stat.std !== undefined
                            ? stat.std.toFixed(2)
                            : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => runDistributionAnalysis(stat.name)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Analyze
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* Correlation Analysis */}
        {selectedAnalysis === 'correlation' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800">Correlation Analysis</h3>
                  <p className="text-sm text-gray-500">Find relationships between numeric variables</p>
                </div>
                
                <div className="p-6 space-y-4">
                  {numericColumns.length < 2 ? (
                    <div className="flex items-center p-4 bg-amber-50 text-amber-700 rounded-lg">
                      <AlertCircle size={20} className="mr-2 flex-shrink-0" />
                      <p>You need at least two numeric columns to run correlation analysis</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label htmlFor="target-column" className="block text-sm font-medium text-gray-700 mb-1">
                          Target Column
                        </label>
                        <select
                          id="target-column"
                          value={correlationTarget}
                          onChange={(e) => setCorrelationTarget(e.target.value)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select a column</option>
                          {numericColumns.map(column => (
                            <option key={column} value={column}>{column}</option>
                          ))}
                        </select>
                        <p className="mt-1 text-sm text-gray-500">
                          Choose a numeric column to find correlations with other variables
                        </p>
                      </div>
                      
                      <button
                        onClick={calculateCorrelations}
                        disabled={!correlationTarget || loading}
                        className={`w-full flex items-center justify-center py-2 px-4 rounded-md font-medium ${
                          !correlationTarget || loading
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
                            Calculating...
                          </>
                        ) : 'Calculate Correlations'}
                      </button>
                      
                      <div className="bg-blue-50 rounded-lg p-4 text-sm">
                        <h4 className="font-medium text-blue-800 mb-2">About Correlation Analysis</h4>
                        <p className="text-blue-700">
                          Correlation measures the strength and direction of relationship between variables.
                          Values range from -1 (perfect negative correlation) to +1 (perfect positive correlation).
                          0 indicates no linear relationship.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-2">
              {analysisResults
                .filter(result => result.type === 'correlation')
                .slice(0, 1)
                .map(result => (
                  <div key={result.id}>
                    {renderCorrelationChart(result)}
                  </div>
                ))}
              
              {analysisResults.filter(result => result.type === 'correlation').length === 0 && (
                <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center text-center h-full">
                  <TrendingUp size={48} className="text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No Correlation Analysis Yet</h3>
                  <p className="text-gray-500 max-w-md">
                    Select a target column and run correlation analysis to see the relationships
                    between your numeric variables.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Correlation Heatmap */}
        {selectedAnalysis === 'heatmap' && (
          <div>
            <CorrelationHeatmap 
              dataset={dataset} 
              onCellClick={(col1, col2, correlation) => {
                console.log(`${col1} vs ${col2}: ${correlation.toFixed(3)}`);
              }}
            />
          </div>
        )}
        
        {/* Distribution Analysis */}
        {selectedAnalysis === 'distribution' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800">Distribution Analysis</h3>
                  <p className="text-sm text-gray-500">Analyze the distribution of a column's values</p>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <label htmlFor="column-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Select Column
                    </label>
                    <select
                      id="column-select"
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      onChange={(e) => runDistributionAnalysis(e.target.value)}
                    >
                      <option value="">Choose a column</option>
                      {dataset.columns.map(column => (
                        <option key={column.name} value={column.name}>{column.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4 text-sm">
                    <h4 className="font-medium text-blue-800 mb-2">About Distribution Analysis</h4>
                    <p className="text-blue-700">
                      For numeric columns, a histogram will show the frequency distribution of values.
                      For categorical columns, a pie chart will show the proportion of each category.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Recently Analyzed</h4>
                    <ul className="space-y-1">
                      {analysisResults
                        .filter(result => result.type === 'distribution')
                        .slice(0, 5)
                        .map(result => (
                          <li key={result.id}>
                            <button
                              onClick={() => setSelectedAnalysis('results')}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              {result.title}
                            </button>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-2">
              {analysisResults
                .filter(result => result.type === 'distribution')
                .slice(0, 1)
                .map(result => (
                  <div key={result.id}>
                    {renderDistributionChart(result)}
                  </div>
                ))}
              
              {analysisResults.filter(result => result.type === 'distribution').length === 0 && (
                <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center text-center h-full">
                  <BarChart2 size={48} className="text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No Distribution Analysis Yet</h3>
                  <p className="text-gray-500 max-w-md">
                    Select a column to analyze its distribution and see patterns in your data.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Analysis Results */}
        {selectedAnalysis === 'results' && (
          <div>
            {analysisResults.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {analysisResults.map(result => (
                  <div key={result.id}>
                    {result.type === 'correlation' && renderCorrelationChart(result)}
                    {result.type === 'distribution' && renderDistributionChart(result)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="flex justify-center mb-4">
                  <PieChart size={48} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No Analysis Results Yet</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Run correlation or distribution analyses to generate insights about your data.
                  Results will appear here for easy reference.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataAnalysis;