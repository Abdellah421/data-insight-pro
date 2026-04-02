import React, { useState, useRef, useCallback } from 'react';
import { BarChart2, LineChart, PieChart, ScatterChart as ScatterPlot, Download, AlertCircle, RefreshCw } from 'lucide-react';
import { Dataset } from '../types';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
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
import { Bar, Line, Pie, Scatter } from 'react-chartjs-2';

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

interface DataVisualizationProps {
  dataset: Dataset;
}

const DataVisualization: React.FC<DataVisualizationProps> = ({ dataset }) => {
  const { dispatch } = useProject();
  const { showToast } = useToast();
  const chartRef = useRef<any>(null);

  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'scatter'>('bar');
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string>('');
  const [groupBy, setGroupBy] = useState<string>('');
  const [chartTitle, setChartTitle] = useState<string>('');
  const [chartError, setChartError] = useState<string | null>(null);
  
  // Filter columns by type
  const numericColumns = dataset.columns
    .filter(col => col.type === 'number')
    .map(col => col.name);
  
  const categoricalColumns = dataset.columns
    .filter(col => col.type === 'string' || col.type === 'boolean')
    .map(col => col.name);
  
  const allColumns = dataset.columns.map(col => col.name);
  
  // Generate chart data based on selected options
  const chartData = React.useMemo(() => {
    if (!xAxis || (chartType !== 'pie' && !yAxis)) {
      return null;
    }
    
    try {
      setChartError(null);
      
      if (chartType === 'pie') {
        // For pie charts, we need to aggregate data
        const aggregatedData: Record<string, number> = {};
        
        dataset.rows.forEach(row => {
          const key = String(row[xAxis] || 'Unknown');
          if (!aggregatedData[key]) {
            aggregatedData[key] = 0;
          }
          aggregatedData[key]++;
        });
        
        // Limit to top 10 categories
        const sortedEntries = Object.entries(aggregatedData)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);
        
        return {
          labels: sortedEntries.map(([label]) => label),
          datasets: [
            {
              data: sortedEntries.map(([_, value]) => value),
              backgroundColor: [
                'rgba(37, 99, 235, 0.7)',    // blue
                'rgba(245, 158, 11, 0.7)',   // amber
                'rgba(16, 185, 129, 0.7)',   // green
                'rgba(220, 38, 38, 0.7)',    // red
                'rgba(139, 92, 246, 0.7)',   // purple
                'rgba(236, 72, 153, 0.7)',   // pink
                'rgba(6, 182, 212, 0.7)',    // cyan
                'rgba(249, 115, 22, 0.7)',   // orange
                'rgba(75, 85, 99, 0.7)',     // gray
                'rgba(124, 58, 237, 0.7)',   // violet
              ],
              borderColor: [
                'rgb(37, 99, 235)',
                'rgb(245, 158, 11)',
                'rgb(16, 185, 129)',
                'rgb(220, 38, 38)',
                'rgb(139, 92, 246)',
                'rgb(236, 72, 153)',
                'rgb(6, 182, 212)',
                'rgb(249, 115, 22)',
                'rgb(75, 85, 99)',
                'rgb(124, 58, 237)',
              ],
              borderWidth: 1,
            },
          ],
        };
      } else if (chartType === 'scatter') {
        // For scatter plots, we need x and y numeric values
        return {
          datasets: [
            {
              label: `${xAxis} vs ${yAxis}`,
              data: dataset.rows.map(row => ({
                x: row[xAxis],
                y: row[yAxis],
              })).filter(point => 
                point.x !== null && point.x !== undefined && 
                point.y !== null && point.y !== undefined
              ),
              backgroundColor: 'rgba(37, 99, 235, 0.7)',
              borderColor: 'rgb(37, 99, 235)',
            },
          ],
        };
      } else {
        // Bar and line charts
        if (groupBy) {
          // Group data by the selected column
          const groupedData: Record<string, Record<string, number>> = {};
          const allXValues = new Set<string>();
          
          dataset.rows.forEach(row => {
            const xValue = String(row[xAxis] || 'Unknown');
            const groupValue = String(row[groupBy] || 'Unknown');
            const yValue = Number(row[yAxis]);
            
            allXValues.add(xValue);
            
            if (!groupedData[groupValue]) {
              groupedData[groupValue] = {};
            }
            
            if (!groupedData[groupValue][xValue]) {
              groupedData[groupValue][xValue] = 0;
            }
            
            // If y is a valid number, add it to the total
            if (!isNaN(yValue)) {
              groupedData[groupValue][xValue] += yValue;
            }
          });
          
          // Convert to ChartJS format
          const xLabels = [...allXValues].sort();
          
          // Generate a color for each group
          const colors = [
            { bg: 'rgba(37, 99, 235, 0.7)', border: 'rgb(37, 99, 235)' },   // blue
            { bg: 'rgba(245, 158, 11, 0.7)', border: 'rgb(245, 158, 11)' }, // amber
            { bg: 'rgba(16, 185, 129, 0.7)', border: 'rgb(16, 185, 129)' }, // green
            { bg: 'rgba(220, 38, 38, 0.7)', border: 'rgb(220, 38, 38)' },   // red
            { bg: 'rgba(139, 92, 246, 0.7)', border: 'rgb(139, 92, 246)' }, // purple
            { bg: 'rgba(236, 72, 153, 0.7)', border: 'rgb(236, 72, 153)' }, // pink
          ];
          
          const datasets = Object.keys(groupedData).map((group, index) => {
            const colorIndex = index % colors.length;
            
            return {
              label: group,
              data: xLabels.map(x => groupedData[group][x] || 0),
              backgroundColor: colors[colorIndex].bg,
              borderColor: colors[colorIndex].border,
              borderWidth: 1,
            };
          });
          
          return {
            labels: xLabels,
            datasets,
          };
        } else {
          // Simple bar or line chart
          const aggregatedData: Record<string, number> = {};
          
          dataset.rows.forEach(row => {
            const xValue = String(row[xAxis] || 'Unknown');
            const yValue = Number(row[yAxis]);
            
            if (!aggregatedData[xValue]) {
              aggregatedData[xValue] = 0;
            }
            
            // If y is a valid number, add it to the total
            if (!isNaN(yValue)) {
              aggregatedData[xValue] += yValue;
            }
          });
          
          // Sort labels alphabetically
          const sortedLabels = Object.keys(aggregatedData).sort();
          
          return {
            labels: sortedLabels,
            datasets: [
              {
                label: yAxis,
                data: sortedLabels.map(label => aggregatedData[label]),
                backgroundColor: 'rgba(37, 99, 235, 0.7)',
                borderColor: 'rgb(37, 99, 235)',
                borderWidth: 1,
              },
            ],
          };
        }
      }
    } catch (error) {
      console.error('Error generating chart data:', error);
      setChartError('Failed to generate chart. Please check your data and selections.');
      return null;
    }
  }, [dataset, chartType, xAxis, yAxis, groupBy]);
  
  // Chart options
  const chartOptions = React.useMemo(() => {
    const title = chartTitle || `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`;
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: chartType === 'pie' ? 'right' : 'top',
        },
        title: {
          display: true,
          text: title,
          font: {
            size: 16,
          },
        },
      },
      scales: chartType !== 'pie' ? {
        x: {
          title: {
            display: true,
            text: xAxis,
          },
        },
        y: {
          title: {
            display: true,
            text: yAxis,
          },
          beginAtZero: true,
        },
      } : undefined,
    };
  }, [chartType, xAxis, yAxis, chartTitle]);
  
  // Handle form submission
  const handleChartFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validation is handled in the chartData useMemo
    // Save chart config to project context when chart is generated
    if (xAxis && (chartType === 'pie' || yAxis)) {
      dispatch({
        type: 'SAVE_CHART_CONFIG',
        payload: {
          chartType,
          xAxis,
          yAxis,
          groupBy,
          title: chartTitle || `${chartType} chart`,
          savedAt: Date.now(),
        },
      });
      dispatch({
        type: 'LOG_ACTION',
        payload: {
          action: 'visualization',
          description: `Created ${chartType} chart: ${xAxis}${yAxis ? ' vs ' + yAxis : ''}`,
          details: { chartType, xAxis, yAxis, groupBy, title: chartTitle },
          timestamp: Date.now(),
        },
      });
    }
  };
  
  // Reset chart
  const resetChart = () => {
    setXAxis('');
    setYAxis('');
    setGroupBy('');
    setChartTitle('');
    setChartError(null);
  };
  
  // Check if we can generate a chart
  const canGenerateChart = (chartType === 'pie' && xAxis) || 
                          (chartType !== 'pie' && xAxis && yAxis);
  
  // Download chart as PNG using ref or canvas fallback
  const downloadChart = useCallback(() => {
    if (chartRef.current) {
      try {
        const b64 = chartRef.current.toBase64Image();
        const link = document.createElement('a');
        link.download = `${chartTitle || 'chart'}.png`;
        link.href = b64;
        link.click();
        showToast('Chart downloaded as PNG!', 'success');
        return;
      } catch { /* fall through */ }
    }
    const canvas = document.querySelector('canvas');
    if (!canvas) { showToast('No chart to download.', 'warning'); return; }
    const link = document.createElement('a');
    link.download = `${chartTitle || 'chart'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Chart downloaded as PNG!', 'success');
  }, [chartRef, chartTitle, showToast]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Data Visualization</h2>
        <p className="text-gray-600">
          Create charts and graphs to visualize your data
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">Chart Configuration</h3>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleChartFormSubmit} className="space-y-4">
                {/* Chart type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chart Type
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'bar', name: 'Bar', icon: <BarChart2 size={18} /> },
                      { id: 'line', name: 'Line', icon: <LineChart size={18} /> },
                      { id: 'pie', name: 'Pie', icon: <PieChart size={18} /> },
                      { id: 'scatter', name: 'Scatter', icon: <ScatterPlot size={18} /> },
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setChartType(type.id as any)}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg ${
                          chartType === type.id
                            ? 'bg-blue-100 text-blue-700 border border-blue-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {type.icon}
                        <span className="mt-1 text-xs">{type.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* X-Axis */}
                <div>
                  <label htmlFor="x-axis" className="block text-sm font-medium text-gray-700 mb-1">
                    X-Axis {chartType === 'pie' ? '(Categories)' : ''}
                  </label>
                  <select
                    id="x-axis"
                    value={xAxis}
                    onChange={(e) => setXAxis(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a column</option>
                    {(chartType === 'scatter' ? numericColumns : allColumns).map(column => (
                      <option key={column} value={column}>{column}</option>
                    ))}
                  </select>
                </div>
                
                {/* Y-Axis (not for pie charts) */}
                {chartType !== 'pie' && (
                  <div>
                    <label htmlFor="y-axis" className="block text-sm font-medium text-gray-700 mb-1">
                      Y-Axis {chartType === 'scatter' ? '(Values)' : '(Measure)'}
                    </label>
                    <select
                      id="y-axis"
                      value={yAxis}
                      onChange={(e) => setYAxis(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select a column</option>
                      {numericColumns.map(column => (
                        <option key={column} value={column}>{column}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Group By (for bar and line charts) */}
                {(chartType === 'bar' || chartType === 'line') && (
                  <div>
                    <label htmlFor="group-by" className="block text-sm font-medium text-gray-700 mb-1">
                      Group By (Optional)
                    </label>
                    <select
                      id="group-by"
                      value={groupBy}
                      onChange={(e) => setGroupBy(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">No grouping</option>
                      {categoricalColumns.map(column => (
                        <option key={column} value={column}>{column}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Chart Title */}
                <div>
                  <label htmlFor="chart-title" className="block text-sm font-medium text-gray-700 mb-1">
                    Chart Title
                  </label>
                  <input
                    id="chart-title"
                    type="text"
                    value={chartTitle}
                    onChange={(e) => setChartTitle(e.target.value)}
                    placeholder="Enter a title for your chart"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={resetChart}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Reset
                  </button>
                  
                  {chartData && (
                    <button
                      type="button"
                      onClick={downloadChart}
                      className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
                    >
                      <Download size={16} className="mr-2" />
                      Download
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
          
          {/* Chart Type Info */}
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Chart Types</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="mt-1 p-1 bg-blue-100 rounded text-blue-700 mr-3">
                  <BarChart2 size={16} />
                </div>
                <div>
                  <strong className="text-gray-800">Bar Chart</strong>
                  <p className="text-sm text-gray-600">
                    Compare values across categories. Great for comparing discrete data points.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="mt-1 p-1 bg-blue-100 rounded text-blue-700 mr-3">
                  <LineChart size={16} />
                </div>
                <div>
                  <strong className="text-gray-800">Line Chart</strong>
                  <p className="text-sm text-gray-600">
                    Show trends over time or continuous data. Best for sequential data.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="mt-1 p-1 bg-blue-100 rounded text-blue-700 mr-3">
                  <PieChart size={16} />
                </div>
                <div>
                  <strong className="text-gray-800">Pie Chart</strong>
                  <p className="text-sm text-gray-600">
                    Display proportions of a whole. Good for showing percentage distribution.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="mt-1 p-1 bg-blue-100 rounded text-blue-700 mr-3">
                  <ScatterPlot size={16} />
                </div>
                <div>
                  <strong className="text-gray-800">Scatter Plot</strong>
                  <p className="text-sm text-gray-600">
                    Reveal relationships between two variables. Great for finding correlations.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">Chart Preview</h3>
            </div>
            
            <div className="p-6">
              {chartError ? (
                <div className="flex items-center p-4 bg-red-50 text-red-700 rounded-lg">
                  <AlertCircle size={20} className="mr-2 flex-shrink-0" />
                  <p>{chartError}</p>
                </div>
              ) : chartData ? (
                <div className="h-[400px]">
                  {chartType === 'bar' && (
                    <Bar ref={chartRef} data={chartData as any} options={chartOptions as any} />
                  )}
                  {chartType === 'line' && (
                    <Line ref={chartRef} data={chartData as any} options={chartOptions as any} />
                  )}
                  {chartType === 'pie' && (
                    <Pie ref={chartRef} data={chartData as any} options={chartOptions as any} />
                  )}
                  {chartType === 'scatter' && (
                    <Scatter ref={chartRef} data={chartData as any} options={chartOptions as any} />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                  {canGenerateChart ? (
                    <div className="animate-pulse flex flex-col items-center">
                      <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17l4-4m0 0l4-4m-4 4l-4-4m4 4l4 4" />
                      </svg>
                      <p className="mt-4 text-gray-500">Generating chart...</p>
                    </div>
                  ) : (
                    <>
                      <BarChart2 size={64} className="text-gray-300 mb-4" />
                      <h3 className="text-xl font-medium text-gray-800 mb-2">No Chart to Display</h3>
                      <p className="text-gray-500 max-w-md">
                        Select your chart type and data columns to generate a visualization.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {chartData && (
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Chart Insights</h3>
              {chartType === 'bar' && (
                <div className="text-gray-600">
                  <p>
                    This bar chart displays <strong>{yAxis}</strong> for each <strong>{xAxis}</strong> value.
                    {groupBy && ` The data is grouped by ${groupBy}.`}
                  </p>
                  <p className="mt-2">
                    The highest values appear to be for categories at the peak of the bars, 
                    while the lowest values are where the bars are shortest.
                  </p>
                  <p className="mt-2">
                    Use this chart to compare values across categories and identify standout values.
                  </p>
                </div>
              )}
              
              {chartType === 'line' && (
                <div className="text-gray-600">
                  <p>
                    This line chart shows <strong>{yAxis}</strong> for each <strong>{xAxis}</strong> value.
                    {groupBy && ` The data is grouped by ${groupBy}.`}
                  </p>
                  <p className="mt-2">
                    Look for trends, patterns, or seasonality in the data. 
                    Rising lines indicate increasing values, while falling lines show decreases.
                  </p>
                  <p className="mt-2">
                    Use this chart to track changes over a sequence or identify patterns in your data.
                  </p>
                </div>
              )}
              
              {chartType === 'pie' && (
                <div className="text-gray-600">
                  <p>
                    This pie chart shows the distribution of <strong>{xAxis}</strong> values.
                    Each slice represents a category's proportion of the total.
                  </p>
                  <p className="mt-2">
                    Larger slices represent more frequent or larger values. 
                    Note that only the top 10 categories are shown to maintain readability.
                  </p>
                  <p className="mt-2">
                    Use this chart to understand the composition of your data and identify dominant categories.
                  </p>
                </div>
              )}
              
              {chartType === 'scatter' && (
                <div className="text-gray-600">
                  <p>
                    This scatter plot shows the relationship between <strong>{xAxis}</strong> and <strong>{yAxis}</strong>.
                    Each point represents a data point with both values.
                  </p>
                  <p className="mt-2">
                    Look for patterns in the distribution of points:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Points forming a line suggest a linear relationship</li>
                    <li>Clustered points indicate groups of similar values</li>
                    <li>Spread-out points may indicate weak or no correlation</li>
                  </ul>
                  <p className="mt-2">
                    Use this chart to identify correlations and relationships between numeric variables.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataVisualization;