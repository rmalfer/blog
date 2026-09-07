'use client';

import React from 'react';
import Link from 'next/link';
import { Bot, Mail, Globe, ArrowUpRight, Cpu } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-black text-neutral-300 pt-16 pb-12 border-t-4 border-emerald-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Top Newsletter CTA */}
        <div id="newsletter" className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 mb-16 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Cpu className="w-4 h-4" />
                <span>Boletim Semanal de Tecnologia</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Receba o futuro diretamente na sua caixa de entrada
              </h3>
              <p className="text-neutral-400 text-sm mt-2 max-w-xl">
                Curadoria aprofundada sobre modelos de Inteligência Artificial, avanços na robótica humanoide e disrupções de mercado. Sem ruído, apenas conteúdo relevante.
              </p>
            </div>
            <div className="lg:col-span-5">
              <form onSubmit={(e) => { e.preventDefault(); alert('Obrigado por assinar!'); }} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  placeholder="Seu melhor e-mail profissional"
                  className="bg-neutral-950 border border-neutral-700 text-white placeholder-neutral-500 text-sm px-4 py-3 rounded focus:outline-none focus:border-emerald-500 flex-1"
                />
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm uppercase px-6 py-3 rounded transition-all whitespace-nowrap"
                >
                  Inscrever-se
                </button>
              </form>
              <span className="text-[11px] text-neutral-500 mt-2 block">
                Privacidade garantida. Você pode cancelar a inscrição a qualquer momento.
              </span>
            </div>
          </div>
        </div>

        {/* Multi-column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-neutral-800">
          {/* Col 1: Brand & Author */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500 text-black font-black text-xl flex items-center justify-center rounded">
                U
              </div>
              <span className="text-2xl font-black tracking-tight text-white uppercase">
                Um Futuro<span className="text-emerald-500">.</span>Próximo
              </span>
            </Link>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-sm">
              Portal independente de jornalismo e análise tecnológica de ponta. Focado na fronteira da Inteligência Artificial, robótica corporificada, saúde preditiva e inovação.
            </p>
            <div className="pt-2 text-xs text-neutral-400">
              <span className="text-white font-semibold block">Autor & Editor-Chefe:</span>
              <span>Riccardo Malfer</span>
            </div>
          </div>

          {/* Col 2: Categorias */}
          <div className="md:col-span-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-4">
              Categorias Principais
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/categoria/inteligencia-artificial" className="text-neutral-400 hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Inteligência Artificial</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-neutral-600" />
                </Link>
              </li>
              <li>
                <Link href="/categoria/robos-humanoides" className="text-neutral-400 hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Robôs Humanoides</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-neutral-600" />
                </Link>
              </li>
              <li>
                <Link href="/categoria/saude-biotec" className="text-neutral-400 hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Saúde & Biotec</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-neutral-600" />
                </Link>
              </li>
              <li>
                <Link href="/categoria/startups-futuro" className="text-neutral-400 hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Startups & Futuro</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-neutral-600" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Navegação & Legal */}
          <div className="md:col-span-4">
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-4">
              Portal & Transparência
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/sitemap.xml" className="text-neutral-400 hover:text-white transition-colors">
                  Mapa do Site (XML Sitemap)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div>
            &copy; {new Date().getFullYear()} Um Futuro Próximo. Todos os direitos reservados. Riccardo Malfer.
          </div>
          <div className="flex items-center gap-6">
            <span>Brasil • São Paulo (BR-SP)</span>
            <span>Versão 2.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
