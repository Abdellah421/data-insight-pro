import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload, Database, BarChart2, ShieldCheck, CheckCircle2, Zap,
  FileSpreadsheet, FileText, FileJson, Brain, Code, ArrowRight,
  Filter, LineChart, Sparkles, ChevronDown, Activity, Layers, Download
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AdSlot from '../components/AdSlot';

export const LandingPage: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const heroBenefits = [
    'CSV, Excel & JSON',
    'No installation required',
    'Free to use',
    'Fast analysis',
  ];

  const steps = [
    {
      step: '01',
      title: 'Upload Your Data',
      desc: 'Drag & drop your CSV, Excel, or JSON dataset. Parsing runs entirely inside your browser for maximum privacy.',
      icon: <Upload className="w-6 h-6 text-blue-600" />,
    },
    {
      step: '02',
      title: 'Explore & Clean',
      desc: 'Instantly view data summaries, inspect column statistics, handle missing values, and filter rows.',
      icon: <Filter className="w-6 h-6 text-indigo-600" />,
    },
    {
      step: '03',
      title: 'Analyze & Visualize',
      desc: 'Generate interactive charts, correlation heatmaps, statistical tests, PCA, and machine learning models.',
      icon: <BarChart2 className="w-6 h-6 text-emerald-600" />,
    },
    {
      step: '04',
      title: 'Export Your Results',
      desc: 'Download cleaned datasets, export python transformation pipelines, or generate automated PDF reports.',
      icon: <Download className="w-6 h-6 text-purple-600" />,
    },
  ];

  const features = [
    {
      title: 'Data Explorer',
      desc: 'Comprehensive summary metrics, column datatypes, missing value counts, and row preview table.',
      icon: <Database className="w-5 h-5 text-blue-600" />,
    },
    {
      title: 'Data Cleaning',
      desc: 'Fill nulls with mean/median/mode, remove duplicate records, handle outliers, and rename columns.',
      icon: <Filter className="w-5 h-5 text-teal-600" />,
    },
    {
      title: 'Data Transformation',
      desc: 'Create calculated columns, encode categorical variables, normalize numeric ranges, and sort records.',
      icon: <Layers className="w-5 h-5 text-indigo-600" />,
    },
    {
      title: 'Data Analysis',
      desc: 'Descriptive summary statistics, parametric & non-parametric statistical hypothesis tests, and pivot tables.',
      icon: <Activity className="w-5 h-5 text-cyan-600" />,
    },
    {
      title: 'Data Visualization',
      desc: 'Customizable bar charts, line plots, scatter charts, correlation matrices, and distribution graphs.',
      icon: <LineChart className="w-5 h-5 text-emerald-600" />,
    },
    {
      title: 'Advanced Analytics',
      desc: 'Principal Component Analysis (PCA), time-series trend decomposition, and anomaly detection.',
      icon: <Zap className="w-5 h-5 text-amber-600" />,
    },
    {
      title: 'Machine Learning',
      desc: 'AutoML classification, linear & logistic regression modeling, and feature importance ranking.',
      icon: <Brain className="w-5 h-5 text-purple-600" />,
    },
    {
      title: 'Smart Profiling',
      desc: 'Automated dataset diagnostics recommending targeted cleaning actions and optimal visualization modes.',
      icon: <Sparkles className="w-5 h-5 text-pink-600" />,
    },
    {
      title: 'Python Export',
      desc: 'Generates clean, reproducible Python code (Pandas & Scikit-Learn) for all applied cleaning steps.',
      icon: <Code className="w-5 h-5 text-gray-700" />,
    },
    {
      title: 'PDF Reports',
      desc: 'Export beautifully formatted PDF executive summaries including statistics and embedded charts.',
      icon: <FileText className="w-5 h-5 text-red-600" />,
    },
  ];

  const tools = [
    {
      title: 'CSV Analyzer',
      desc: 'Parse, inspect, clean, and visualize CSV files directly online.',
      link: '/tools/csv-analyzer',
      icon: <FileText className="w-6 h-6 text-green-600" />,
    },
    {
      title: 'Excel Analyzer',
      desc: 'Analyze multi-column Excel spreadsheets (.xlsx, .xls) without Microsoft Office.',
      link: '/tools/excel-analyzer',
      icon: <FileSpreadsheet className="w-6 h-6 text-emerald-600" />,
    },
    {
      title: 'Data Cleaner',
      desc: 'Remove duplicates, impute missing values, and trim whitespace online.',
      link: '/tools/data-cleaner',
      icon: <Filter className="w-6 h-6 text-blue-600" />,
    },
    {
      title: 'Data Visualizer',
      desc: 'Convert tabular dataset records into interactive charts and heatmaps.',
      link: '/tools/data-visualizer',
      icon: <BarChart2 className="w-6 h-6 text-purple-600" />,
    },
  ];

  const useCases = [
    {
      role: 'Students & Educators',
      desc: 'Perform statistics and data science assignments online without setting up complex Python or R environments.',
    },
    {
      role: 'Data Analysts',
      desc: 'Quickly profile customer datasets, inspect distributions, and export cleaned CSVs in minutes.',
    },
    {
      role: 'Researchers',
      desc: 'Execute hypothesis testing, correlation analysis, and trend decomposition directly from tabular files.',
    },
    {
      role: 'Business Owners',
      desc: 'Convert sales logs and operational spreadsheets into executive charts and downloadable PDF summaries.',
    },
    {
      role: 'Software Developers',
      desc: 'Prototype data cleaning transformations visually and copy the generated Pandas code directly into projects.',
    },
  ];

  const faqs = [
    {
      q: 'Is DataInsight Pro really free?',
      a: 'Yes! DataInsight Pro is completely free to use with no hidden fees, paywalls, or mandatory signups.',
    },
    {
      q: 'Do I need to create an account or sign in?',
      a: 'No account or login is required. You can immediately access the full application at /app and begin analyzing your files.',
    },
    {
      q: 'What file formats are supported?',
      a: 'DataInsight Pro supports CSV (.csv), Excel (.xlsx, .xls), and JSON (.json) files containing tabular data records.',
    },
    {
      q: 'Is my data uploaded to a server?',
      a: 'No. All file parsing, statistical processing, cleaning, and visualization generation are performed 100% client-side directly inside your web browser. Your dataset content never leaves your device.',
    },
    {
      q: 'Can I clean and transform my data online?',
      a: 'Yes. You can impute missing values, drop duplicate rows, detect outliers, transform columns, normalize numerical variables, and export the resulting clean dataset.',
    },
    {
      q: 'Can I export Python code for my cleaning steps?',
      a: 'Yes. DataInsight Pro automatically builds a reproducible Python pipeline script matching all the data cleaning and transformation steps you perform.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-gray-900 selection:bg-blue-100 selection:text-blue-700">
      {/* Navbar */}
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-blue-50/60 via-slate-50 to-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 text-blue-700 border border-blue-200 text-xs font-semibold mb-6 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>100% In-Browser Private & Free Data Platform</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Analyze Your Data Online, <span className="text-blue-600 underline decoration-blue-300 decoration-wavy underline-offset-8">For Free</span>
          </h1>

          {/* Supporting Text */}
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Upload CSV, Excel, or JSON files and explore statistics, clean your data, create visualizations, and discover insights without installing complicated software.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/app"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-blue-600 text-white font-bold text-base shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-xl transition-all duration-200"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Analyze Your Data Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white border border-gray-300 text-gray-700 font-semibold text-base shadow-sm hover:bg-gray-50 transition"
            >
              <span>Explore Features</span>
            </a>
          </div>

          {/* Hero Benefits Badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium text-gray-600">
            {heroBenefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          {/* Interactive Product Preview Mockup */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl border border-gray-200/80 bg-white p-3 sm:p-4 shadow-2xl shadow-blue-900/10">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-xl mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-xs text-gray-400 ml-2 font-mono">datainsight-pro.app/app</span>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                Live Data Workspace
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-2 text-left">
              <div className="md:col-span-1 bg-slate-50 p-3 rounded-xl border border-gray-200 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Workspace Datasets</p>
                <div className="p-2.5 bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center justify-between shadow-xs">
                  <span className="truncate">sales_data_q3.csv</span>
                  <span className="bg-blue-700 text-[10px] px-1.5 py-0.5 rounded">1,240 rows</span>
                </div>
                <div className="space-y-1 pt-2">
                  <div className="p-2 bg-white text-gray-700 rounded text-xs font-medium border border-gray-200 flex items-center justify-between">
                    <span>Data Explorer</span>
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <div className="p-2 bg-white text-gray-600 rounded text-xs font-medium border border-gray-200">Data Cleaning</div>
                  <div className="p-2 bg-white text-gray-600 rounded text-xs font-medium border border-gray-200">Data Visualization</div>
                  <div className="p-2 bg-white text-gray-600 rounded text-xs font-medium border border-gray-200">ML Analysis</div>
                </div>
              </div>

              <div className="md:col-span-3 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-600 font-medium">Total Records</p>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">1,240</p>
                  </div>
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                    <p className="text-xs text-emerald-600 font-medium">Variables</p>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">14 Columns</p>
                  </div>
                  <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                    <p className="text-xs text-purple-600 font-medium">Data Completeness</p>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">98.4%</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-700">Distribution Overview</p>
                    <p className="text-xs text-gray-500">Revenue vs Units Sold Correlation</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded text-[11px] font-medium text-gray-600">Bar Chart</span>
                    <span className="px-2 py-1 bg-blue-600 text-white rounded text-[11px] font-medium">Heatmap</span>
                  </div>
                </div>

                <div className="h-32 bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 rounded-xl border border-gray-200 flex items-center justify-center text-xs text-gray-500 font-mono">
                  [ Interactive Chart Engine Preview ]
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-16 md:py-24 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Simple 4-Step Process</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Analyze Your Data in 4 Simple Steps
            </p>
            <p className="mt-3 text-gray-600 text-base">
              No technical setup, database configuration, or account registration required.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s) => (
              <div key={s.step} className="bg-slate-50/80 rounded-2xl p-6 border border-gray-200/80 hover:border-blue-300 transition-all duration-200 relative group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-xs border border-gray-200 group-hover:scale-105 transition-transform">
                    {s.icon}
                  </div>
                  <span className="text-2xl font-black text-gray-300 group-hover:text-blue-600 transition-colors">
                    {s.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ad Slot Placeholder */}
      <AdSlot slotId="landing-between-steps" className="max-w-4xl mx-auto" />

      {/* FEATURES SECTION */}
      <section id="features" className="py-16 md:py-24 bg-slate-50/60 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Complete Toolkit</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Everything You Need to Analyze Your Data
            </p>
            <p className="mt-3 text-gray-600 text-base">
              Full-featured statistics, machine learning, data cleaning, and export capabilities right in your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SUPPORTED FILE FORMATS SECTION */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
            <div className="max-w-3xl">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
                Work With Your Existing Data Files
              </h2>
              <p className="text-blue-200 text-base mb-8">
                DataInsight Pro works with standard tabular data formats up to 50,000+ rows instantly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-6 h-6 text-green-400" />
                  <h3 className="font-bold text-lg">CSV Files</h3>
                </div>
                <p className="text-xs text-blue-200">Supports standard comma-separated and tab-delimited text files with custom delimiters.</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                  <h3 className="font-bold text-lg">Excel Workbooks</h3>
                </div>
                <p className="text-xs text-blue-200">Parses both modern .xlsx and legacy .xls spreadsheets directly without Excel software.</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <FileJson className="w-6 h-6 text-amber-400" />
                  <h3 className="font-bold text-lg">JSON Datasets</h3>
                </div>
                <p className="text-xs text-blue-200">Reads JSON arrays of objects natively and flattens structured key-value pairs.</p>
              </div>
            </div>

            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition"
            >
              <span>Analyze Your Data Free Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FREE TOOLS SECTION */}
      <section id="tools" className="py-16 md:py-24 bg-slate-50/60 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Dedicated Web Tools</h2>
            <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Free Data Analysis Tools
            </p>
            <p className="mt-3 text-gray-600 text-base">
              Specific online utilities tailored for your data workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tools.map((t) => (
              <Link
                key={t.title}
                to={t.link}
                className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-gray-200 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    {t.icon}
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-blue-600 transition-colors">
                    {t.title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">{t.desc}</p>
                </div>
                <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                  Open Tool <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES SECTION */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Versatile Workflow</h2>
            <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Built for Anyone Working With Data
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {useCases.map((uc) => (
              <div key={uc.role} className="bg-slate-50 p-6 rounded-2xl border border-gray-200">
                <h3 className="text-base font-bold text-gray-900 mb-2">{uc.role}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO CONTENT SECTION */}
      <section className="py-16 bg-slate-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-slate">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4">
            Free Online Data Analysis Platform
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            DataInsight Pro is a public, free online platform designed for quick, secure tabular data exploration. Whether you need to quickly inspect a newly downloaded CSV file, clean up missing values in an Excel spreadsheet, or fit a machine learning model to a JSON dataset, DataInsight Pro delivers enterprise-grade analytical tools directly in your browser window.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Unlike traditional desktop statistics software or cloud platforms that require complex account setups, paid subscriptions, and remote data uploads, DataInsight Pro processes every file 100% locally on your own computer. Your data privacy is guaranteed, and analysis completes at maximum native speed.
          </p>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-16 md:py-24 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Got Questions?</h2>
            <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Frequently Asked Questions
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={faq.q}
                className="border border-gray-200 rounded-xl overflow-hidden bg-white"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-gray-900 text-base hover:bg-slate-50 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      activeFaq === idx ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-sm text-gray-600 border-t border-gray-100 pt-3 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-20 bg-gradient-to-b from-blue-600 to-blue-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
            Ready to Analyze Your Data?
          </h2>
          <p className="text-blue-100 text-base sm:text-lg max-w-xl mx-auto mb-8">
            Upload your dataset and start exploring it instantly with DataInsight Pro. Free, no registration required.
          </p>
          <Link
            to="/app"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-white text-blue-700 font-extrabold text-base shadow-xl hover:bg-blue-50 transition-all duration-200"
          >
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>Analyze Your Data Free</span>
            <ArrowRight className="w-5 h-5 text-blue-700" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
