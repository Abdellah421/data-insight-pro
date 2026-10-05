import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Mail, Linkedin, ShieldCheck } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8 px-4 sm:px-6 lg:px-8 mt-auto z-40">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Column 1: Brand */}
        <div className="space-y-3 md:col-span-1">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              DataInsight <span className="text-blue-400">Pro</span>
            </span>
          </Link>
          <p className="text-xs text-slate-400 leading-relaxed">
            Free online tools for exploring, cleaning, analyzing, and visualizing tabular data with 100% in-browser privacy.
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium pt-1">
            <ShieldCheck className="w-4 h-4" />
            <span>100% Client-Side Data Processing</span>
          </div>
        </div>

        {/* Column 2: Tools */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Analysis Tools</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/app" className="hover:text-white transition">Data Insight Workspace</Link></li>
            <li><Link to="/tools/csv-analyzer" className="hover:text-white transition">CSV Analyzer</Link></li>
            <li><Link to="/tools/excel-analyzer" className="hover:text-white transition">Excel Analyzer</Link></li>
            <li><Link to="/tools/data-cleaner" className="hover:text-white transition">Data Cleaner</Link></li>
            <li><Link to="/tools/data-visualizer" className="hover:text-white transition">Data Visualizer</Link></li>
          </ul>
        </div>

        {/* Column 3: Platform */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Platform</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/guides" className="hover:text-white transition">Guides & Tutorials</Link></li>
            <li><Link to="/pricing" className="hover:text-white transition">Pricing</Link></li>
            <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-white transition">Contact Support</Link></li>
            <li><Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-white transition">Terms of Service</Link></li>
          </ul>
        </div>

        {/* Column 4: Developer Contact */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Contact</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <a href="mailto:benkhalouqabdellah@gmail.com" className="flex items-center gap-2 hover:text-white transition">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>benkhalouqabdellah@gmail.com</span>
              </a>
            </li>
            <li>
              <a
                href="https://linkedin.com/in/abdellah-benkhalouq-144363282/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition"
              >
                <Linkedin className="w-3.5 h-3.5 text-blue-400" />
                <span>LinkedIn Profile</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
        <p>© {new Date().getFullYear()} DataInsight Pro. All rights reserved.</p>
        <p className="text-[11px]">Free, No-Login Data Analysis Engine.</p>
      </div>
    </footer>
  );
};

export default Footer;
