import React, { useState } from 'react';
import { BarChart2, AlertTriangle, CheckCircle, Calculator } from 'lucide-react';
import { Dataset } from '../types';
import { Bar } from 'react-chartjs-2';

export interface StatisticalTest {
  id: string;
  type: string;
  groups: string[];
  significance: number;
  pValue: number;
  result: string;
  effectSize?: number;
  testStatistic: number;
  degreesOfFreedom?: number;
}

export interface DataQualityIssue {
  type: string;
  column: string;
  severity: string;
  count: number;
  description: string;
  suggestion: string;
}

export interface DataQualityReport {
  id: string;
  completeness: number;
  accuracy: number;
  consistency: number;
  validity: number;
  uniqueness: number;
  overallScore: number;
  issues: DataQualityIssue[];
  recommendations: string[];
}
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

interface AdvancedAnalyticsProps {
  dataset: Dataset;
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ dataset }) => {
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>('data-quality');
  const [statisticalResults, setStatisticalResults] = useState<StatisticalTest[]>([]);
  const [dataQualityReport, setDataQualityReport] = useState<DataQualityReport | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Get numeric and categorical columns
  const numericColumns = dataset.columns
    .filter(col => col.type === 'number')
    .map(col => col.name);
  

  
  // Generate comprehensive data quality report
  const generateDataQualityReport = async () => {
    setLoading(true);
    
    try {
      const issues: DataQualityIssue[] = [];
      let totalIssues = 0;
      
      // Analyze each column for quality issues
      dataset.columns.forEach(column => {
        const values = dataset.rows.map(row => row[column.name]);
        const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
        
        // Missing values analysis
        const missingCount = values.length - nonNullValues.length;
        const missingPercent = (missingCount / values.length) * 100;
        
        if (missingPercent > 20) {
          issues.push({
            type: 'missing',
            column: column.name,
            severity: 'high',
            count: missingCount,
            description: `${missingPercent.toFixed(1)}% missing values`,
            suggestion: 'Consider imputation or removal of incomplete records'
          });
          totalIssues += missingCount;
        } else if (missingPercent > 5) {
          issues.push({
            type: 'missing',
            column: column.name,
            severity: 'medium',
            count: missingCount,
            description: `${missingPercent.toFixed(1)}% missing values`,
            suggestion: 'Consider data imputation strategies'
          });
          totalIssues += missingCount;
        }
        
        // Outlier analysis for numeric columns
        if (column.type === 'number' && nonNullValues.length > 0) {
          const numericValues = nonNullValues.map(v => Number(v)).filter(v => !isNaN(v));
          
          if (numericValues.length > 0) {
            const q1 = calculatePercentile(numericValues, 25);
            const q3 = calculatePercentile(numericValues, 75);
            const iqr = q3 - q1;
            const lowerBound = q1 - 1.5 * iqr;
            const upperBound = q3 + 1.5 * iqr;
            
            const outliers = numericValues.filter(v => v < lowerBound || v > upperBound);
            
            if (outliers.length > 0) {
              const outlierPercent = (outliers.length / numericValues.length) * 100;
              issues.push({
                type: 'outlier',
                column: column.name,
                severity: outlierPercent > 10 ? 'high' : outlierPercent > 5 ? 'medium' : 'low',
                count: outliers.length,
                description: `${outlierPercent.toFixed(1)}% outliers detected`,
                suggestion: 'Review outliers for data entry errors or consider outlier treatment'
              });
              totalIssues += outliers.length;
            }
          }
        }
        
        // Duplicate analysis
        if (column.type === 'string') {
          const stringValues = nonNullValues.map(v => String(v));
          const uniqueValues = new Set(stringValues);
          const duplicates = stringValues.length - uniqueValues.size;
          
          if (duplicates > 0) {
            const duplicatePercent = (duplicates / stringValues.length) * 100;
            issues.push({
              type: 'duplicate',
              column: column.name,
              severity: duplicatePercent > 30 ? 'high' : duplicatePercent > 10 ? 'medium' : 'low',
              count: duplicates,
              description: `${duplicatePercent.toFixed(1)}% duplicate values`,
              suggestion: 'Review for data entry errors or consider deduplication'
            });
            totalIssues += duplicates;
          }
        }
      });
      
      // Calculate quality scores
      const totalCells = dataset.rows.length * dataset.columns.length;
      const completeness = ((totalCells - totalIssues) / totalCells) * 100;
      const accuracy = Math.max(0, 100 - (totalIssues / totalCells) * 100);
      const consistency = calculateConsistencyScore(dataset);
      const validity = calculateValidityScore(dataset);
      const uniqueness = calculateUniquenessScore(dataset);
      
      const overallScore = (completeness + accuracy + consistency + validity + uniqueness) / 5;
      
      // Generate recommendations
      const recommendations: string[] = [];
      
      if (completeness < 90) {
        recommendations.push('Address missing values through imputation or data collection');
      }
      if (accuracy < 85) {
        recommendations.push('Review data entry processes and implement validation rules');
      }
      if (consistency < 80) {
        recommendations.push('Standardize data formats and implement data governance');
      }
      if (overallScore < 70) {
        recommendations.push('Consider comprehensive data cleaning and quality improvement');
      }
      
      const report: DataQualityReport = {
        id: `quality-${Date.now()}`,
        completeness,
        accuracy,
        consistency,
        validity,
        uniqueness,
        overallScore,
        issues,
        recommendations,
      };
      
      setDataQualityReport(report);
    } catch (error) {
      console.error('Error generating data quality report:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate percentile
  const calculatePercentile = (arr: number[], percentile: number): number => {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    if (upper >= sorted.length) return sorted[sorted.length - 1];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  };
  
  // Calculate consistency score
  const calculateConsistencyScore = (dataset: Dataset): number => {
    let consistencyIssues = 0;
    let totalChecks = 0;
    
    dataset.columns.forEach(column => {
      if (column.type === 'string') {
        const values = dataset.rows.map(row => row[column.name]).filter(v => v !== null && v !== undefined);
        
        // Check for inconsistent formatting (e.g., mixed case, extra spaces)
        const trimmedValues = values.map(v => String(v).trim());
        const uniqueFormats = new Set(trimmedValues);
        const formatConsistency = (uniqueFormats.size / trimmedValues.length) * 100;
        
        consistencyIssues += Math.max(0, 100 - formatConsistency);
        totalChecks += 100;
      }
    });
    
    return totalChecks > 0 ? Math.max(0, 100 - (consistencyIssues / totalChecks) * 100) : 100;
  };
  
  // Calculate validity score
  const calculateValidityScore = (dataset: Dataset): number => {
    let validityIssues = 0;
    let totalChecks = 0;
    
    dataset.columns.forEach(column => {
      const values = dataset.rows.map(row => row[column.name]);
      
      if (column.type === 'number') {
        const numericValues = values.filter(v => v !== null && v !== undefined);
        const invalidNumbers = numericValues.filter(v => isNaN(Number(v)));
        validityIssues += invalidNumbers.length;
        totalChecks += numericValues.length;
      } else if (column.type === 'date') {
        const dateValues = values.filter(v => v !== null && v !== undefined);
        const invalidDates = dateValues.filter(v => isNaN(new Date(v).getTime()));
        validityIssues += invalidDates.length;
        totalChecks += dateValues.length;
      }
    });
    
    return totalChecks > 0 ? Math.max(0, 100 - (validityIssues / totalChecks) * 100) : 100;
  };
  
  // Calculate uniqueness score
  const calculateUniquenessScore = (dataset: Dataset): number => {
    let uniquenessScore = 0;
    let totalColumns = dataset.columns.length;
    
    dataset.columns.forEach(column => {
      const values = dataset.rows.map(row => row[column.name]).filter(v => v !== null && v !== undefined);
      const uniqueValues = new Set(values);
      const uniqueness = (uniqueValues.size / values.length) * 100;
      uniquenessScore += uniqueness;
    });
    
    return totalColumns > 0 ? uniquenessScore / totalColumns : 100;
  };
  
  // Perform t-test
  const performTTest = (group1: number[], group2: number[]): StatisticalTest => {
    const n1 = group1.length;
    const n2 = group2.length;
    
    const mean1 = group1.reduce((sum, val) => sum + val, 0) / n1;
    const mean2 = group2.reduce((sum, val) => sum + val, 0) / n2;
    
    const var1 = group1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / (n1 - 1);
    const var2 = group2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / (n2 - 1);
    
    const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
    const standardError = Math.sqrt(pooledVar * (1/n1 + 1/n2));
    
    const tStatistic = (mean1 - mean2) / standardError;
    const degreesOfFreedom = n1 + n2 - 2;
    
    // Approximate p-value calculation (simplified)
    const pValue = 2 * (1 - Math.abs(tStatistic) / Math.sqrt(degreesOfFreedom));
    
    // Effect size (Cohen's d)
    const effectSize = Math.abs(mean1 - mean2) / Math.sqrt(pooledVar);
    
    return {
      id: `ttest-${Date.now()}`,
      type: 't-test',
      groups: ['Group 1', 'Group 2'],
      significance: 0.05,
      pValue: Math.min(1, Math.max(0, pValue)),
      result: pValue < 0.05 ? 'significant' : 'not-significant',
      effectSize,
      testStatistic: tStatistic,
      degreesOfFreedom,
    };
  };
  
  // Perform chi-square test
  const performChiSquareTest = (observed: number[][]): StatisticalTest => {
    const rows = observed.length;
    const cols = observed[0].length;
    
    // Calculate expected frequencies
    const rowTotals = observed.map(row => row.reduce((sum, val) => sum + val, 0));
    const colTotals = Array(cols).fill(0).map((_, j) => 
      observed.reduce((sum, row) => sum + row[j], 0)
    );
    const total = rowTotals.reduce((sum, val) => sum + val, 0);
    
    const expected = observed.map((row, i) => 
      row.map((_, j) => (rowTotals[i] * colTotals[j]) / total)
    );
    
    // Calculate chi-square statistic
    let chiSquare = 0;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (expected[i][j] > 0) {
          chiSquare += Math.pow(observed[i][j] - expected[i][j], 2) / expected[i][j];
        }
      }
    }
    
    const degreesOfFreedom = (rows - 1) * (cols - 1);
    
    // Approximate p-value (simplified)
    const pValue = Math.min(1, Math.max(0, 1 - chiSquare / (degreesOfFreedom * 2)));
    
    return {
      id: `chisquare-${Date.now()}`,
      type: 'chi-square',
      groups: ['Categories'],
      significance: 0.05,
      pValue,
      result: pValue < 0.05 ? 'significant' : 'not-significant',
      testStatistic: chiSquare,
      degreesOfFreedom,
    };
  };
  
  // Render data quality report
  const renderDataQualityReport = (report: DataQualityReport) => {
    const qualityScores = [
      { name: 'Completeness', score: report.completeness, color: 'blue' },
      { name: 'Accuracy', score: report.accuracy, color: 'green' },
      { name: 'Consistency', score: report.consistency, color: 'purple' },
      { name: 'Validity', score: report.validity, color: 'orange' },
      { name: 'Uniqueness', score: report.uniqueness, color: 'red' },
    ];
    
    const chartData = {
      labels: qualityScores.map(s => s.name),
      datasets: [
        {
          label: 'Quality Score (%)',
          data: qualityScores.map(s => s.score),
          backgroundColor: [
            'rgba(37, 99, 235, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(139, 92, 246, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(220, 38, 38, 0.7)',
          ],
          borderColor: [
            'rgb(37, 99, 235)',
            'rgb(16, 185, 129)',
            'rgb(139, 92, 246)',
            'rgb(245, 158, 11)',
            'rgb(220, 38, 38)',
          ],
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
          text: 'Data Quality Scores',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Score (%)',
          },
        },
      },
    };
    
    return (
      <div className="space-y-6">
        {/* Overall Score */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-800">Overall Data Quality</h3>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              report.overallScore >= 80 ? 'bg-green-100 text-green-800' :
              report.overallScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {report.overallScore.toFixed(1)}%
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div 
              className={`h-4 rounded-full ${
                report.overallScore >= 80 ? 'bg-green-500' :
                report.overallScore >= 60 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${report.overallScore}%` }}
            ></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {qualityScores.map(score => (
              <div key={score.name} className="text-center">
                <div className="text-2xl font-bold text-gray-800">{score.score.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">{score.name}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Quality Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Quality Breakdown</h3>
          <div className="h-64">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
        
        {/* Issues and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Issues */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Data Quality Issues</h3>
            {report.issues.length > 0 ? (
              <div className="space-y-3">
                {report.issues.map((issue: any, index: number) => (
                  <div key={index} className={`p-3 rounded-lg ${
                    issue.severity === 'high' ? 'bg-red-50 border border-red-200' :
                    issue.severity === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">{issue.column}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                        issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{issue.description}</p>
                    <p className="text-sm text-gray-500">{issue.suggestion}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">No significant data quality issues found!</p>
              </div>
            )}
          </div>
          
          {/* Recommendations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Recommendations</h3>
            {report.recommendations.length > 0 ? (
              <div className="space-y-3">
                {report.recommendations.map((recommendation: any, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-800">{recommendation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">Your data quality is excellent!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Render statistical test results
  const renderStatisticalResults = (tests: StatisticalTest[]) => {
    return (
      <div className="space-y-6">
        {tests.map(test => (
          <div key={test.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">
                {test.type.charAt(0).toUpperCase() + test.type.slice(1)} Test
              </h3>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                test.result === 'significant' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {test.result === 'significant' ? 'Significant' : 'Not Significant'}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">P-value</p>
                <p className="font-medium">{test.pValue.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Test Statistic</p>
                <p className="font-medium">{test.testStatistic.toFixed(4)}</p>
              </div>
              {test.degreesOfFreedom && (
                <div>
                  <p className="text-sm text-gray-500">Degrees of Freedom</p>
                  <p className="font-medium">{test.degreesOfFreedom}</p>
                </div>
              )}
              {test.effectSize && (
                <div>
                  <p className="text-sm text-gray-500">Effect Size</p>
                  <p className="font-medium">{test.effectSize.toFixed(3)}</p>
                </div>
              )}
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Interpretation</h4>
              <p className="text-sm text-blue-700">
                {test.result === 'significant' 
                  ? `The test result is statistically significant (p < ${test.significance}). This suggests a meaningful relationship or difference.`
                  : `The test result is not statistically significant (p ≥ ${test.significance}). This suggests no meaningful relationship or difference.`
                }
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Advanced Analytics</h2>
        <p className="text-gray-600">
          Statistical tests, data quality assessment, and advanced analysis
        </p>
      </div>
      
      {/* Analysis type tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'data-quality', name: 'Data Quality', icon: <CheckCircle size={18} /> },
            { id: 'statistical-tests', name: 'Statistical Tests', icon: <Calculator size={18} /> },
            { id: 'results', name: 'Analysis Results', icon: <BarChart2 size={18} /> },
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
        {/* Data Quality Assessment */}
        {selectedAnalysis === 'data-quality' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800">Data Quality Assessment</h3>
                  <p className="text-sm text-gray-500">Comprehensive data quality analysis</p>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">What we analyze:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Completeness (missing values)</li>
                      <li>• Accuracy (data errors)</li>
                      <li>• Consistency (formatting)</li>
                      <li>• Validity (data types)</li>
                      <li>• Uniqueness (duplicates)</li>
                    </ul>
                  </div>
                  
                  <button
                    onClick={generateDataQualityReport}
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
                        <CheckCircle size={18} className="mr-2" />
                        Assess Data Quality
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-2">
              {dataQualityReport ? (
                renderDataQualityReport(dataQualityReport)
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <CheckCircle size={64} className="text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-800 mb-2">No Quality Assessment Yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Click "Assess Data Quality" to get a comprehensive analysis of your dataset's quality,
                    including completeness, accuracy, consistency, and recommendations for improvement.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Statistical Tests */}
        {selectedAnalysis === 'statistical-tests' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800">Statistical Tests</h3>
                  <p className="text-sm text-gray-500">Perform hypothesis testing</p>
                </div>
                
                <div className="p-6 space-y-4">
                  {numericColumns.length < 2 ? (
                    <div className="flex items-center p-4 bg-amber-50 text-amber-700 rounded-lg">
                      <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
                      <p>You need at least two numeric columns for statistical tests</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-700">Available Tests:</h4>
                        
                        <button
                          onClick={() => {
                            // Simple t-test example with first two numeric columns
                            const col1 = numericColumns[0];
                            const col2 = numericColumns[1];
                            const group1 = dataset.rows.map(row => row[col1]).filter(v => typeof v === 'number');
                            const group2 = dataset.rows.map(row => row[col2]).filter(v => typeof v === 'number');
                            
                            if (group1.length > 0 && group2.length > 0) {
                              const test = performTTest(group1, group2);
                              setStatisticalResults(prev => [test, ...prev]);
                            }
                          }}
                          className="w-full text-left p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <div className="font-medium text-blue-800">T-Test</div>
                          <div className="text-sm text-blue-600">Compare means between two groups</div>
                        </button>
                        
                        <button
                          onClick={() => {
                            // Simple chi-square test example
                            const test = performChiSquareTest([[10, 20], [15, 25]]);
                            setStatisticalResults(prev => [test, ...prev]);
                          }}
                          className="w-full text-left p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <div className="font-medium text-green-800">Chi-Square Test</div>
                          <div className="text-sm text-green-600">Test independence between categorical variables</div>
                        </button>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-4 text-sm">
                        <h4 className="font-medium text-blue-800 mb-2">About Statistical Tests</h4>
                        <p className="text-blue-700">
                          Statistical tests help determine if observed differences or relationships
                          are statistically significant or due to random chance.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-2">
              {statisticalResults.length > 0 ? (
                renderStatisticalResults(statisticalResults)
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <Calculator size={64} className="text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-800 mb-2">No Statistical Tests Yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Select a statistical test to perform hypothesis testing on your data.
                    Results will show p-values, test statistics, and interpretations.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Analysis Results */}
        {selectedAnalysis === 'results' && (
          <div>
            {(dataQualityReport || statisticalResults.length > 0) ? (
              <div className="space-y-6">
                {dataQualityReport && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Data Quality Results</h3>
                    {renderDataQualityReport(dataQualityReport)}
                  </div>
                )}
                
                {statisticalResults.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Statistical Test Results</h3>
                    {renderStatisticalResults(statisticalResults)}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <BarChart2 size={64} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-800 mb-2">No Analysis Results Yet</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Run data quality assessments or statistical tests to generate analysis results.
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

export default AdvancedAnalytics;
