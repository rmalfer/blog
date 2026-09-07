'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu, X, Bot, ChevronRight } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Início', href: '/' },
  { label: 'Inteligência Artificial', href: '/categoria/inteligencia-artificial' },
  { label: 'Robôs Humanoides', href: '/categoria/robos-humanoides' },
  { label: 'Saúde & Biotec', href: '/categoria/saude-biotec' },
  { label: 'Startups & Futuro', href: '/categoria/startups-futuro' },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const currentDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="w-full bg-white border-b border-neutral-200 sticky top-0 z-50">
      {/* Top Banner Ticker */}
      <div className="bg-neutral-950 text-neutral-300 text-xs py-1.5 px-4 sm:px-8 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="hidden sm:inline-block capitalize text-neutral-400 font-medium">
              {currentDate}
            </span>
            <span className="hidden sm:inline-block text-neutral-600">|</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold tracking-wide uppercase text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Em Destaque:
            </span>
            <span className="text-neutral-200 hover:text-white truncate">
              Avanços da Robótica Corporificada, IA Geral e o Futuro Humanoide
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-medium shrink-0">
            <span className="hidden md:inline-block text-neutral-400">
              Por Riccardo Malfer
            </span>
          </div>
        </div>
      </div>

      {/* Main Branding & Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo estilo TechCrunch */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-black text-emerald-400 font-black text-2xl flex items-center justify-center rounded group-hover:bg-emerald-500 group-hover:text-black transition-all">
              U
            </div>
            <div className="flex flex-col">
              <span className="text-2xl sm:text-3xl font-black tracking-tighter text-black uppercase leading-none font-sans">
                Um Futuro<span className="text-emerald-500">.</span>Próximo
              </span>
              <span className="text-[10px] tracking-widest uppercase font-bold text-neutral-500 mt-1">
                Inteligência Artificial & Robótica • Riccardo Malfer
              </span>
            </div>
          </Link>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Pesquisar notícias de tecnologia..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-64 pl-3 pr-8 py-1.5 text-sm bg-neutral-50 border border-neutral-300 rounded-full focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-2.5 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-full transition-colors"
                title="Pesquisar"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            <a
              href="#newsletter"
              className="bg-black hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded transition-all shadow-sm flex items-center gap-1.5"
            >
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>Boletim IA</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-neutral-700 hover:text-black"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-neutral-900 hover:text-emerald-600"
              aria-label="Abrir menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {searchOpen && (
          <div className="lg:hidden pb-3">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                placeholder="Pesquisar notícias..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-4 pr-10 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-emerald-500"
              />
              <button type="submit" className="absolute right-3 text-neutral-500">
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Desktop Category Nav Bar */}
        <nav className="hidden lg:flex items-center gap-8 py-3 border-t border-neutral-100 text-sm font-bold tracking-tight uppercase">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors relative py-1 ${
                  isActive
                    ? 'text-emerald-600 border-b-2 border-emerald-500 font-extrabold'
                    : 'text-neutral-700 hover:text-black'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-neutral-200 px-4 py-4 space-y-3">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between py-2 text-base font-bold uppercase ${
                  isActive ? 'text-emerald-600' : 'text-neutral-800'
                }`}
              >
                <span>{link.label}</span>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
