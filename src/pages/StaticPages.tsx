import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check, Shield, Lock, FileText, ArrowRight, Mail, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const PricingPage: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-slate-50 text-gray-900">
    <Navbar />
    <main className="flex-1 py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Transparent Pricing</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">
          DataInsight Pro is 100% free to use for all data exploration, cleaning, analysis, and visualization.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
          {/* FREE PLAN (CURRENT) */}
          <div className="bg-white p-8 rounded-3xl border-2 border-blue-600 shadow-xl relative">
            <div className="absolute -top-3.5 right-6 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Current Active Plan
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Free Plan</h2>
            <p className="text-sm text-gray-500 mb-6">Full public access to all data engines</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-extrabold text-gray-900">$0</span>
              <span className="text-gray-500 font-medium">/ forever</span>
            </div>

            <ul className="space-y-3 mb-8 text-sm text-gray-700">
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-600" /> Full CSV, Excel & JSON support</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-600" /> Complete Data Cleaning & Transformation</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-600" /> Interactive Charts & Correlation Heatmap</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-600" /> Machine Learning & Smart Profiling</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-600" /> Python Code Export</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-600" /> PDF Executive Report Export</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-600" /> 100% In-Browser Privacy</li>
            </ul>

            <Link
              to="/app"
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md hover:bg-blue-700 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Use Free Plan Now</span>
            </Link>
          </div>

          {/* FUTURE PRO PLAN */}
          <div className="bg-slate-100/80 p-8 rounded-3xl border border-gray-200 shadow-xs relative opacity-90">
            <div className="absolute -top-3.5 right-6 bg-gray-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Future Plan (Optional)
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pro Plan</h2>
            <p className="text-sm text-gray-500 mb-6">Future cloud sync & team features</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-extrabold text-gray-400">Coming Soon</span>
            </div>

            <ul className="space-y-3 mb-8 text-sm text-gray-600">
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-gray-400" /> All Free Plan Features Included</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-gray-400" /> Cloud Workspace Persistence</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-gray-400" /> Unlimited Project Cloud Sync</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-gray-400" /> Team Workspace Collaboration</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-gray-400" /> Premium AI Insights Assistant</li>
            </ul>

            <button disabled className="w-full py-3.5 px-6 rounded-xl bg-gray-300 text-gray-500 font-bold text-sm cursor-not-allowed">
              Coming in Future Phase
            </button>
          </div>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export const AboutPage: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-slate-50 text-gray-900">
    <Navbar />
    <main className="flex-1 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6">About DataInsight Pro</h1>
        <div className="bg-white p-8 rounded-2xl border border-gray-200 space-y-6 text-gray-700 text-base leading-relaxed">
          <p>
            <strong>DataInsight Pro</strong> is an open online data analysis platform designed to give data analysts, students, researchers, developers, and business professionals instant statistical insight into tabular data.
          </p>
          <p>
            Traditional data analysis software requires installing complex desktop dependencies (like Python libraries, R, or heavy spreadsheet applications) or sending sensitive company data to third-party cloud servers.
          </p>
          <p>
            DataInsight Pro takes a different approach: <strong>100% In-Browser Execution</strong>. All file parsing (CSV via Web Workers, Excel via SheetJS, JSON natively), cleaning, statistical computations, and chart rendering happen locally in your web browser memory.
          </p>
          <h2 className="text-xl font-bold text-gray-900 pt-4">Core Principles</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>No Barrier Access:</strong> Zero forced signups, mandatory emails, or paywalls.</li>
            <li><strong>Data Privacy:</strong> Datasets stay in client memory and are never transmitted to external servers.</li>
            <li><strong>Reproducibility:</strong> Automatically generate clean Python Pandas code matching your data cleaning workflow.</li>
          </ul>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export const ContactPage: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-slate-50 text-gray-900">
    <Navbar />
    <main className="flex-1 py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 text-center">Contact Us</h1>
        <p className="text-gray-600 text-center mb-10">Have feedback, suggestions, or technical questions about DataInsight Pro?</p>

        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Your Name</label>
            <input type="text" placeholder="Jane Doe" className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
            <input type="email" placeholder="jane@example.com" className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
            <textarea rows={4} placeholder="How can we help?" className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <button onClick={() => alert('Thank you! Your feedback has been received.')} className="w-full py-3.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition">
            Send Message
          </button>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export const PrivacyPage: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-slate-50 text-gray-900">
    <Navbar />
    <main className="flex-1 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Privacy Policy</h1>
        <div className="bg-white p-8 rounded-2xl border border-gray-200 space-y-6 text-gray-700 text-sm leading-relaxed">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-medium flex items-start gap-3">
            <Shield className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>100% In-Browser Local Data Processing Guarantee</strong>
              <p className="text-xs text-emerald-800 mt-1">
                DataInsight Pro executes all dataset parsing, filtering, statistics, and chart rendering inside your local web browser. Uploaded dataset files are NEVER uploaded to external servers or stored in cloud databases.
              </p>
            </div>
          </div>

          <h2 className="text-lg font-bold text-gray-900">1. Data Ownership & Security</h2>
          <p>You retain 100% ownership of all dataset files and projects processed on DataInsight Pro. Because data remains strictly inside browser client memory (and optional local device storage), your sensitive information is never exposed to remote network transmission.</p>

          <h2 className="text-lg font-bold text-gray-900">2. Local Storage</h2>
          <p>DataInsight Pro automatically saves active workspace projects locally to your web browser (via localStorage or IndexedDB) on your own device so you can resume work. This storage is completely local to your browser and is never synced to remote clouds unless explicitly requested in future versions.</p>

          <h2 className="text-lg font-bold text-gray-900">3. Analytics</h2>
          <p>We may track basic anonymous usage metrics (such as page views and button clicks) to improve user experience. Raw dataset contents, column names, and row values are NEVER sent as analytics data.</p>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export const TermsPage: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-slate-50 text-gray-900">
    <Navbar />
    <main className="flex-1 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Terms of Service</h1>
        <div className="bg-white p-8 rounded-2xl border border-gray-200 space-y-6 text-gray-700 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-gray-900">1. Usage Rights</h2>
          <p>DataInsight Pro is provided as a free public data analysis tool. You are permitted to use the platform for personal, educational, academic, commercial, and professional data exploration.</p>

          <h2 className="text-lg font-bold text-gray-900">2. Disclaimer of Warranties</h2>
          <p>The service is provided "as is" without warranty of any kind. While DataInsight Pro strives for maximum mathematical and statistical precision, users are responsible for verifying analytical outputs for critical decision-making.</p>

          <h2 className="text-lg font-bold text-gray-900">3. Limitation of Liability</h2>
          <p>DataInsight Pro and its creators shall not be liable for any direct, indirect, or consequential damages resulting from the use or inability to use this platform.</p>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);
