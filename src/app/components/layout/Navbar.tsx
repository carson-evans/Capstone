import React from 'react';
import { Link } from 'react-router';
import { Button } from '@/app/components/ui/button'; // Added this back
import logo from '../../../assets/logo.png'; 

export function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      {/* Keeping our adjusted padding for that perfect optical alignment */}
      <div className="container mx-auto pl-2 pr-8 h-24 flex items-center justify-between">
        
        <Link to="/" className="text-xl font-bold tracking-tight text-[#1e3a5f] flex items-center gap-2">
          <img 
            src={logo} 
            alt="CommonMASS Logo" 
            className="h-20 w-auto" 
          />
        </Link>

        {/* FAQ now styled as a button matching the old 'Sign Up' look */}
        <div className="flex items-center">
          <Link to="/faq">
            <Button 
              className="bg-[#1e3a5f] text-white hover:bg-[#f97316] px-6 py-2 rounded-md font-medium transition-colors cursor-pointer"
            >
              FAQ
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}