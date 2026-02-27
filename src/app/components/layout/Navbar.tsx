import React from 'react';
import { Link } from 'react-router';
import { Button } from '@/app/components/ui/button';

export function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight text-[#1e3a5f] flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1e3a5f] rounded-full flex items-center justify-center text-white font-serif italic">
            C
          </div>
          <span>CommonMASS</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/faq">
            <Button variant="ghost" className="text-sm font-medium text-gray-600 hover:text-[#1e3a5f]">
              FAQ
            </Button>
          </Link>
          <Button variant="ghost" className="text-sm font-medium text-gray-600 hover:text-[#1e3a5f]">
            Log In
          </Button>
          <Button variant="default" className="bg-[#1e3a5f] text-white hover:bg-[#152a45]">
            Sign Up
          </Button>
        </div>
      </div>
    </nav>
  );
}