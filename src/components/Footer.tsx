import React from 'react';
import { Mail, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-700 text-white py-4 px-8 font-sans mt-auto z-50 rounded-t-lg shadow-lg mx-auto w-full max-w-7xl">
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm font-medium">
        
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
