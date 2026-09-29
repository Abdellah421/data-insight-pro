import React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FileText, FileSpreadsheet, Filter, BarChart2, CheckCircle2, ArrowRight, Sparkles, ShieldCheck, Download, Zap
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AdSlot from '../components/AdSlot';

interface ToolInfo {
  title: string;
  h1: string;
  metaDesc: string;
  icon: React.ReactNode;
  summary: string;
  howItWorks: string[];
  features: string[];
  formats: string[];
  faq: { q: string; a: string }[];
}

const toolConfigs: Record<string, ToolInfo> = {
  'csv-analyzer': {
    title: 'Free CSV Analyzer Online',
    h1: 'Free CSV Analyzer & Inspector Online',
    metaDesc: 'Analyze CSV files online for free. Inspect statistics, missing values, clean data, create charts, and export cleaned CSV files without software installation.',
    icon: <FileText className="w-8 h-8 text-green-600" />,
    summary: 'Analyze, inspect, clean, and visualize any CSV (Comma-Separated Values) file directly in your web browser with 100% data privacy.',
    howItWorks: [
      'Upload your .csv file or drag & drop it into the workspace.',
      'DataInsight Pro parses CSV data in a Web Worker for smooth performance.',
      'Explore column datatypes, summary statistics, missing values, and correlation heatmaps.',
      'Export cleaned CSV data or download Python Pandas code.',
    ],
    features: [
      'Instant CSV summary metrics & column distributions',
      'Automatic missing value detection & imputation',
      'Interactive Chart.js visualizations & correlation matrix',
      'Export cleaned CSV and generated Python code',
    ],
    formats: ['CSV (.csv)', 'TSV (.tsv)', 'Custom Delimited Text'],
    faq: [
      {
        q: 'Is my CSV uploaded to a server?',
        a: 'No. All CSV parsing and analysis run 100% inside your local web browser. Your data remains completely private.',
      },
      {
        q: 'What size CSV files can I analyze?',
        a: 'DataInsight Pro easily handles CSV files with up to 50,000+ rows directly in browser memory.',
      },
    ],
  },
  'excel-analyzer': {
    title: 'Free Excel Analyzer Online',
    h1: 'Free Online Excel Sheet Analyzer (.xlsx, .xls)',
    metaDesc: 'Analyze Excel spreadsheets online for free. Inspect workbook sheets, clean data, visualize metrics, and discover insights without Microsoft Excel.',
    icon: <FileSpreadsheet className="w-8 h-8 text-emerald-600" />,
    summary: 'Inspect, summarize, clean, and visualize Excel spreadsheets (.xlsx, .xls) online without needing Microsoft Excel software installed.',
    howItWorks: [
      'Upload your Excel spreadsheet (.xlsx or .xls).',
      'SheetJS parses the spreadsheet content locally in your browser memory.',
      'Review column statistics, filter records, compute group summaries, and run ML analysis.',
      'Export cleaned results back to XLSX or CSV.',
    ],
    features: [
      'Supports .xlsx and legacy .xls spreadsheet formats',
      'Automatic column data type profiling & stats',
      'Outlier detection and missing value handling',
      'Interactive data charts & automated PDF report export',
    ],
    formats: ['Excel Workbook (.xlsx)', 'Excel 97-2003 (.xls)'],
    faq: [
      {
        q: 'Do I need Microsoft Office installed?',
        a: 'No. DataInsight Pro parses Excel spreadsheets in browser memory without requiring Excel or Office installation.',
      },
      {
        q: 'Can I convert my Excel file to CSV or PDF?',
        a: 'Yes. You can clean your Excel spreadsheet and export it as CSV, JSON, or an executive PDF report.',
      },
    ],
  },
  'data-cleaner': {
    title: 'Free Online Data Cleaning Tool',
    h1: 'Free Online Data Cleaning & Preprocessing Tool',
    metaDesc: 'Clean CSV, Excel, and JSON data online for free. Fill missing values, remove duplicates, handle outliers, and export clean datasets.',
    icon: <Filter className="w-8 h-8 text-blue-600" />,
    summary: 'Effortlessly clean dirty datasets. Impute null values, drop duplicates, fix column datatypes, trim whitespace, and normalize numerical ranges online.',
    howItWorks: [
      'Upload your CSV, Excel, or JSON dataset.',
      'Select data cleaning operations from the Data Cleaning panel.',
      'Apply missing value imputation (mean/median/mode), duplicate removal, or outlier filtering.',
      'Export the pristine dataset or copy generated Python transformation code.',
    ],
    features: [
      'Drop duplicate rows and null values in one click',
      'Mean, median, mode, or constant value imputation',
      'Outlier detection via Interquartile Range (IQR) & Z-Score',
      'Categorical encoding and numerical min-max normalization',
    ],
    formats: ['CSV (.csv)', 'Excel (.xlsx)', 'JSON (.json)'],
    faq: [
      {
        q: 'Can I export Python code for my cleaning steps?',
        a: 'Yes. DataInsight Pro automatically generates clean Python code (Pandas) matching your exact cleaning steps.',
      },
      {
        q: 'Will my original dataset file be modified on disk?',
        a: 'No. All cleaning is performed in memory. You can download the cleaned result as a new file.',
      },
    ],
  },
  'data-visualizer': {
    title: 'Free Online Data Visualization Tool',
    h1: 'Free Online Data Visualization & Chart Maker',
    metaDesc: 'Visualize CSV, Excel, and JSON data online for free. Create bar charts, line graphs, scatter plots, and correlation heatmaps in seconds.',
    icon: <BarChart2 className="w-8 h-8 text-purple-600" />,
    summary: 'Turn raw tabular data into interactive, presentation-ready charts, scatter plots, line graphs, and correlation heatmaps.',
    howItWorks: [
      'Upload your data file (CSV, Excel, or JSON).',
      'Select your desired chart type (Bar, Line, Scatter, Pie, Doughnut, Heatmap).',
      'Choose X and Y variables, configure aggregations, and inspect distribution charts.',
      'Export high-resolution chart images or generate a full PDF report.',
    ],
    features: [
      'Interactive Chart.js plotting engine',
      'Bar, line, scatter, radar, pie, and doughnut charts',
      'Correlation heatmaps for numerical variables',
      'Export charts directly into PDF reports',
    ],
    formats: ['CSV (.csv)', 'Excel (.xlsx)', 'JSON (.json)'],
    faq: [
      {
        q: 'Can I customize chart variables and axes?',
        a: 'Yes. You can customize X and Y axes, aggregation modes, color schemes, and chart titles.',
      },
      {
        q: 'Is my visualization shareable or exportable?',
        a: 'Yes. You can export chart snapshots directly into executive PDF reports.',
      },
    ],
  },
};

export const ToolPage: React.FC = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const config = (toolId && toolConfigs[toolId]) || toolConfigs['csv-analyzer'];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-gray-900">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-12 pb-16 bg-gradient-to-b from-blue-50/70 to-slate-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-gray-200 flex items-center justify-center mx-auto mb-6">
            {config.icon}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            {config.h1}
          </h1>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
            {config.summary}
          </p>

          <Link
            to="/app"
            className="inline-flex items-center gap-2.5 px-7 py-4 rounded-xl bg-blue-600 text-white font-bold text-base shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-xl transition"
          >
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span>Launch {config.title} Free</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% In-Browser Private & Free • No Account Needed</span>
          </div>
        </div>
      </section>

      {/* Ad Slot */}
      <AdSlot slotId={`tool-${toolId}-top`} className="max-w-4xl mx-auto" />

      {/* Content Section */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* How It Works */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Zap className="w-6 h-6 text-blue-600" />
                How It Works
              </h2>
              <ol className="space-y-4">
                {config.howItWorks.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-gray-200">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-700 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Key Features */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                Key Capabilities
              </h2>
              <ul className="space-y-3">
                {config.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-slate-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {config.faq.map((f, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2 text-base">{f.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold mb-4">Start Analyzing Now</h2>
          <p className="text-blue-100 mb-8">No installation or login required. Upload your file to get started.</p>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-blue-700 font-bold text-base shadow-lg hover:bg-blue-50 transition"
          >
            <span>Open DataInsight Pro Workspace</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ToolPage;
