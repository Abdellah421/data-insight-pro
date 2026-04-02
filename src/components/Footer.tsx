import React from 'react';
import { Mail, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-panel/40 backdrop-blur-md border-t border-white/5 py-6 px-8 mt-auto z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-6 text-sm">
        
        {/* Email Link */}
        <a 
          href="mailto:benkhalouqabdellah@gmail.com" 
          className="flex items-center gap-2 hover:text-cyan-500 transition-colors duration-200"
        >
          <Mail size={16} />
          <span>benkhalouqabdellah@gmail.com</span>
        </a>

        {/* Divider (Hidden on mobile) */}
        <span className="hidden md:inline-block text-slate-400">|</span>

        {/* LinkedIn Link */}
        <a 
          href="https://linkedin.com/in/abdellah-benkhalouq-144363282/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-cyan-500 transition-colors duration-200"
        >
          <Linkedin size={16} />
          <span>linkedin.com/in/abdellah-benkhalouq-144363282</span>
        </a>
        
      </div>
    </footer>
  );
};

export default Footer;
