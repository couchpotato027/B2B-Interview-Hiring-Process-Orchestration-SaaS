'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronDown,
  Shield,
  Zap,
  Layers,
  BarChart3,
  Bell,
  CheckCircle,
  GitMerge,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="bg-white min-h-screen font-[family-name:var(--font-geist-sans)]">
      {/* ─── Nav ─── */}
      <header className="fixed inset-x-0 top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <nav className="flex items-center justify-between max-w-7xl mx-auto px-6 lg:px-8 h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex gap-0.5">
                <div className="w-3 h-7 rounded-sm bg-slate-900" />
                <div className="w-3 h-7 rounded-sm bg-emerald-500" />
              </div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">HireFlow</span>
            </Link>
            <div className="hidden lg:flex items-center gap-6">
              <Link href="#features" className="text-sm font-medium text-emerald-600">Features</Link>
              <button className="text-sm font-medium text-slate-600 hover:text-slate-900 transition inline-flex items-center gap-1">
                Learn <ChevronDown className="h-3 w-3" />
              </button>
              <Link href="#services" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">Services</Link>
              <Link href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">Pricing</Link>
              <Link href="#about" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">About</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:inline-flex text-sm font-semibold text-slate-900 hover:text-emerald-600 transition-colors px-4 py-2 rounded-full border border-slate-200 hover:border-emerald-200">
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-[#c8ff00]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-emerald-200/30 rounded-full blur-2xl" />
        <div className="absolute top-40 right-40 w-3 h-3 bg-[#c8ff00] rotate-45" />
        <div className="absolute top-60 right-60 w-2 h-2 bg-slate-400 rotate-45" />
        <div className="absolute top-32 right-32 w-2 h-2 bg-emerald-400 rounded-full" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                A Modern Hiring
                <br />
                Platform For A<br />
                <span className="text-slate-900">Modern World</span>
              </h1>
              <p className="mt-6 text-lg text-slate-500 max-w-lg leading-relaxed">
                This modern hiring platform embraces the era of streamlined recruitment,
                enabling swift and effortless hiring with configurable pipelines.
                No more fumbling with spreadsheets or struggling with outdated ATS.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-[#c8ff00] px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[#d4ff33] transition-colors"
                >
                  Explore More <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Trusted by logos */}
              <div className="mt-16 flex items-center gap-8 opacity-50">
                <span className="text-sm font-medium text-slate-400 italic">Precision</span>
                <span className="text-sm font-bold text-slate-400">HRIT</span>
                <span className="text-sm font-medium text-slate-400 italic">Aveniello</span>
                <span className="text-sm font-bold text-slate-400">Streich</span>
                <span className="text-sm font-medium text-slate-400 italic">Blitech</span>
              </div>
            </div>

            {/* Hero card (Pipeline visual) */}
            <div className="relative hidden lg:block">
              <div className="relative bg-slate-900 rounded-3xl p-8 shadow-2xl transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Pipeline Overview</span>
                    <span className="text-xs text-emerald-400 font-medium">LIVE</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                      <span className="text-sm text-white flex-1">Applied</span>
                      <span className="text-sm text-white font-mono">128</span>
                      <div className="w-20 h-2 rounded-full bg-slate-700 overflow-hidden">
                        <div className="w-full h-full bg-emerald-400 rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-[#c8ff00]" />
                      <span className="text-sm text-white flex-1">Screening</span>
                      <span className="text-sm text-white font-mono">84</span>
                      <div className="w-20 h-2 rounded-full bg-slate-700 overflow-hidden">
                        <div className="w-16 h-full bg-[#c8ff00] rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-indigo-400" />
                      <span className="text-sm text-white flex-1">Interview</span>
                      <span className="text-sm text-white font-mono">42</span>
                      <div className="w-20 h-2 rounded-full bg-slate-700 overflow-hidden">
                        <div className="w-10 h-full bg-indigo-400 rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-pink-400" />
                      <span className="text-sm text-white flex-1">Offer</span>
                      <span className="text-sm text-white font-mono">18</span>
                      <div className="w-20 h-2 rounded-full bg-slate-700 overflow-hidden">
                        <div className="w-5 h-full bg-pink-400 rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-300" />
                      <span className="text-sm text-white flex-1">Hired</span>
                      <span className="text-sm text-white font-mono">12</span>
                      <div className="w-20 h-2 rounded-full bg-slate-700 overflow-hidden">
                        <div className="w-3 h-full bg-emerald-300 rounded-full" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between text-xs text-slate-500">
                    <span>Updated just now</span>
                    <span className="text-emerald-400">↑ 12% this week</span>
                  </div>
                </div>
              </div>
              {/* Floating decorative pixel blocks */}
              <div className="absolute -top-6 -right-6 grid grid-cols-4 gap-1">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-sm ${[0,1,5,6,9,10,11,14,15].includes(i) ? 'bg-[#c8ff00]' : [2,3,7].includes(i) ? 'bg-emerald-400' : 'bg-transparent'}`} />
                ))}
              </div>
              <div className="absolute -bottom-4 -left-4 w-8 h-8 border-2 border-emerald-400 rotate-45" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Global Services Section ─── */}
      <section id="features" className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
                We Tried To Provide You<br />
                With All Hiring<br />
                <span className="text-slate-900">Services</span>
              </h2>
            </div>
            <div>
              <p className="text-slate-500 leading-relaxed">
                We made every effort to ensure that you have access to a comprehensive
                range of hiring services. Our aim was to provide a seamless hiring
                experience that caters to your recruitment needs regardless of your scale.
              </p>
              <Link
                href="/register"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                Explore More <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Feature cards grid */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Simultaneous And Fast Operation</h3>
              <p className="mt-2 text-xs text-slate-500">Process multiple candidates across parallel pipeline stages with automated stage execution.</p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                <Layers className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Connected To All Departments</h3>
              <p className="mt-2 text-xs text-slate-500">Unified multi-tenant platform connecting recruiters, interviewers, and hiring managers.</p>
            </div>

            <div className="rounded-2xl bg-[#c8ff00] p-6 shadow-sm border border-[#b5e800] hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-slate-900" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Strong And Advanced Encryption</h3>
              <p className="mt-2 text-xs text-slate-700">Enterprise-grade security with RBAC, JWT authentication, and tenant-isolated data.</p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Comprehensive Analytics</h3>
              <p className="mt-2 text-xs text-slate-500">Pipeline funnel, dropoff rates, time-to-hire trends, and offer acceptance analytics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Services Section ─── */}
      <section id="services" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
                Up-To-Date And Fast Hiring<br />
                Services In One Place
              </h2>
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0">
              <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition text-slate-400">←</button>
              <button className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white hover:bg-slate-800 transition">→</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow bg-white">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-6">
                <GitMerge className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Configurable Pipeline Builder</h3>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                You can easily build any type of hiring pipeline, including interview stages,
                assessments, and background checks, with configurable SLA timers for each stage.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow bg-white">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-6">
                <Target className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Decision Aggregation Engine</h3>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                Automated feedback aggregation with consensus-driven strategy patterns.
                Detect conflicts in interviewer recommendations and surface decisions instantly.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow bg-white">
              <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center mb-6">
                <Bell className="h-5 w-5 text-pink-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">SLA Monitoring & Alerts</h3>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                Background workers continuously monitor candidate stage durations.
                Receive instant alerts via email or Slack when SLA thresholds are breached.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Distinctive Features ─── */}
      <section className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold text-emerald-600 tracking-widest uppercase mb-2">From 2024 →</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
                What Features Make Our
                <br />
                Hiring Platform <span className="italic font-serif text-emerald-600">Distinctive</span>
                <br />
                And <span className="italic font-serif text-[#c8ff00] bg-slate-900 px-2 rounded">Popular</span> ?
              </h2>
              <p className="mt-6 text-sm text-slate-500 leading-relaxed max-w-md">
                According to the needs of teams and different hiring strategies, we have designed
                a platform that can be the answer to all your recruitment needs.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-x-12 gap-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#c8ff00] flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-slate-900" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">State Pattern Workflows</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#c8ff00] flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-slate-900" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Low Overhead</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Ease Of Use</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Multi-Tenant Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Team Friendly</span>
                </div>
              </div>
            </div>

            {/* Decorative visual */}
            <div className="relative hidden lg:flex items-center justify-center">
              <div className="relative w-80 h-80">
                {/* Dotted circle */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-200" />
                <div className="absolute inset-8 rounded-full border-2 border-dashed border-slate-200" />
                {/* Center card */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 w-48">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-[#c8ff00]" />
                      <span className="text-xs font-semibold text-slate-900">HireFlow Pro</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">98%</div>
                    <div className="text-xs text-slate-500 mt-1">SLA Compliance</div>
                    <div className="mt-3 w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="w-[98%] h-full bg-gradient-to-r from-emerald-400 to-[#c8ff00] rounded-full" />
                    </div>
                  </div>
                </div>
                {/* Floating icons */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#c8ff00] flex items-center justify-center shadow-md">
                  <Users className="h-5 w-5 text-slate-900" />
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-emerald-400 flex items-center justify-center shadow-md">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-indigo-400 flex items-center justify-center shadow-md">
                  <GitMerge className="h-5 w-5 text-white" />
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-pink-400 flex items-center justify-center shadow-md">
                  <Shield className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-0.5">
                  <div className="w-3 h-7 rounded-sm bg-white" />
                  <div className="w-3 h-7 rounded-sm bg-emerald-400" />
                </div>
                <span className="text-lg font-bold tracking-tight">HireFlow</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                A modern hiring platform for modern teams. Built to orchestrate the entire recruitment lifecycle.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Quick Access</h4>
              <ul className="space-y-2">
                <li><Link href="/register" className="text-sm text-slate-400 hover:text-white transition">Get Started</Link></li>
                <li><Link href="/login" className="text-sm text-slate-400 hover:text-white transition">Sign In</Link></li>
                <li><Link href="#features" className="text-sm text-slate-400 hover:text-white transition">Features</Link></li>
                <li><Link href="#services" className="text-sm text-slate-400 hover:text-white transition">Services</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2">
                <li><span className="text-sm text-slate-400">Pipeline Builder</span></li>
                <li><span className="text-sm text-slate-400">SLA Monitoring</span></li>
                <li><span className="text-sm text-slate-400">Analytics</span></li>
                <li><span className="text-sm text-slate-400">Team Management</span></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Stay Updated</h4>
              <p className="text-sm text-slate-400 mb-4">Get the latest news and updates.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="flex-1 rounded-full bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
                <button className="rounded-full bg-[#c8ff00] px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-[#d4ff33] transition-colors whitespace-nowrap">
                  Subscribe ↗
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-500">Copyright © 2026 HireFlow. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
