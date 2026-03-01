import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="bg-white min-h-screen">
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-indigo-600">
                HireFlow SaaS
              </span>
            </a>
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end gap-x-6 items-center">
            <Link href="/login" className="text-sm font-semibold leading-6 text-gray-900 hover:text-emerald-600 transition-colors">
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </nav>
      </header>

      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-4xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <div className="inline-flex items-center gap-x-2 rounded-full px-4 py-1.5 text-sm font-semibold leading-6 text-emerald-600 ring-1 ring-emerald-600/20 mb-8 bg-emerald-50">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              Orchestrate Hiring at Scale
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl">
              The coordination layer for modern hiring teams
            </h1>
            <p className="mt-8 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
              Go beyond traditional Applicant Tracking Systems. Streamline your entire hiring workflow with configurable pipelines, SLA monitoring, and structured continuous feedback.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/register"
                className="rounded-full bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors flex items-center gap-2"
              >
                Create Tenant <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="text-sm font-semibold leading-6 text-gray-900 group">
                Learn more <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </a>
            </div>
          </div>
        </div>

        {/* Decorative Grid Background */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      </div>
    </div>
  );
}
