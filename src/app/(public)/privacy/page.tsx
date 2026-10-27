import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ShieldCheck,
  Lock,
  Database,
  Cookie,
  UserCheck,
  FileCheck,
  HelpCircle,
  ArrowLeft,
  Server,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Adsetspro Platform',
  description:
    'Learn how Adsetspro Platform protects your enterprise multi-tenant data, enforces strict tenant isolation, and complies with modern privacy standards.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'October 27, 2026';

  const sections = [
    { id: 'overview', title: '1. Overview & Scope' },
    { id: 'data-collected', title: '2. Information We Collect' },
    { id: 'data-processing', title: '3. How We Process Your Data' },
    { id: 'tenant-isolation', title: '4. Multi-Tenant Data Isolation & Security' },
    { id: 'cookies-storage', title: '5. Cookies & Local Storage' },
    { id: 'subprocessors', title: '6. Infrastructure & Subprocessors' },
    { id: 'data-ownership', title: '7. Data Ownership & Retention' },
    { id: 'user-rights', title: '8. Your Rights & Data Portability' },
    { id: 'contact', title: '9. Contact & Inquiries' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-zinc-100 font-sans pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Hero Header */}
        <header className="space-y-4 pb-8 border-b border-slate-200 dark:border-zinc-800">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Enterprise Data Governance</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            Adsetspro Platform Privacy Policy
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
            This Privacy Policy details how Adsetspro Platform (&quot;Adsetspro&quot;, &quot;we&quot;, &quot;us&quot;, or
            &quot;our&quot;) collects, processes, and protects company data, employee information, and task content
            across our multi-tenant cloud project orchestration software.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-500 dark:text-zinc-400">
            <span className="font-mono bg-slate-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
              Last Updated: {lastUpdated}
            </span>
            <span>•</span>
            <span className="font-mono bg-slate-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
              Version 2.4 Enterprise
            </span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Row-Level Security Active
            </span>
          </div>
        </header>

        {/* Main Content Layout with Sticky Quick-Nav */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Quick Nav Sidebar (Desktop) */}
          <aside className="hidden lg:block col-span-1">
            <div className="sticky top-28 p-4 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Contents
              </h2>
              <nav className="space-y-1">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block text-xs text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 py-1 transition-colors truncate"
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Policy Document Body */}
          <article className="col-span-1 lg:col-span-3 space-y-10 text-sm leading-relaxed text-slate-700 dark:text-zinc-300">
            {/* Section 1 */}
            <section id="overview" className="space-y-3 scroll-mt-28">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <span>1. Overview &amp; Scope</span>
              </h2>
              <p>
                Adsetspro Platform is a multi-tenant enterprise software-as-a-service (SaaS) application offering
                project management, departmental task pipelines, peer reviews, real-time messaging, and team
                analytics.
              </p>
              <p>
                This policy applies to all users accessing Adsetspro, including Super Administrators, Company
                Administrators, Department Heads, and Employees (&quot;Authorized Users&quot;), as well as visitors
                to our public registration and marketing pages.
              </p>
            </section>

            {/* Section 2 */}
            <section id="data-collected" className="space-y-3 scroll-mt-28">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-500" />
                <span>2. Information We Collect</span>
              </h2>
              <p>We collect information strictly necessary to provide and operate the platform:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-zinc-400">
                <li>
                  <strong className="text-slate-800 dark:text-zinc-200">Account &amp; Organization Data:</strong>{' '}
                  Company name, tenant slug, business email, contact phone number, billing address, and company
                  branding assets (logos).
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-zinc-200">User Profiles:</strong> Full name, corporate
                  email address, assigned department, role (Company Admin, Department Head, Employee), and optional
                  profile avatar.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-zinc-200">Task &amp; Project Content:</strong> Task
                  titles, descriptions, priorities, deadlines, status transitions, review notes, attachments (up to
                  50MB per file), and comments.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-zinc-200">Communication Data:</strong> Direct
                  messages, department channel chats, and system alerts generated during task review workflows.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-zinc-200">Technical &amp; Telemetry Data:</strong> IP
                  addresses, browser user agent, device timestamps, audit log records of administrative actions, and
                  error reports.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="data-processing" className="space-y-3 scroll-mt-28">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-500" />
                <span>3. How We Process Your Data</span>
              </h2>
              <p>We process collected data exclusively for the following operational purposes:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-xs mb-1">
                    Role-Based Access Control
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Ensuring employees only access tasks, reviews, and channels designated by their company
                    administrators.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-xs mb-1">
                    Workflow &amp; Audit Trail
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Recording status changes, peer review outcomes, and approval signatures for enterprise
                    accountability.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-xs mb-1">
                    Real-Time Notifications
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Alerting team members to urgent task deadlines, revision requests, and new messages via Web
                    Audio and badge alerts.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-xs mb-1">
                    Performance &amp; Analytics
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Computing task velocity, completion ratios, and department productivity charts visible to
                    managers.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="tenant-isolation" className="space-y-3 scroll-mt-28">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-500" />
                <span>4. Multi-Tenant Data Isolation &amp; Security</span>
              </h2>
              <p>
                Security is foundational to our multi-tenant architecture. Every enterprise organization operates
                under isolated logical domains:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-zinc-400">
                <li>
                  <strong className="text-slate-800 dark:text-zinc-200">Supabase Row-Level Security (RLS):</strong>{' '}
                  All database tables enforce RLS policies verifying <code className="text-xs font-mono bg-slate-200/70 dark:bg-zinc-800 px-1 py-0.5 rounded">company_id</code> on every query, ensuring zero cross-tenant leakage.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-zinc-200">Encryption in Transit &amp; at Rest:</strong>{' '}
                  All data in transit is encrypted using TLS 1.3. Persistent database tables and file attachments
                  are encrypted at rest with AES-256 standards.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-zinc-200">Scoped Signed URLs:</strong> Task
                  attachments and media stored in object storage buckets are delivered through short-lived,
                  cryptographically signed URLs with strict authorization checks.
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="cookies-storage" className="space-y-3 scroll-mt-28">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cookie className="w-5 h-5 text-indigo-500" />
                <span>5. Cookies &amp; Local Storage</span>
              </h2>
              <p>
                Adsetspro uses essential cookies and local storage tokens solely for session management and user
                interface customization:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 dark:bg-zinc-800/80 font-bold text-slate-900 dark:text-white">
                    <tr>
                      <th className="p-3">Identifier</th>
                      <th className="p-3">Storage Type</th>
                      <th className="p-3">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                    <tr>
                      <td className="p-3 font-mono">saaa_session</td>
                      <td className="p-3">HTTP-Only Cookie</td>
                      <td className="p-3 text-slate-600 dark:text-zinc-400">
                        Secure authenticated session token containing user and organization context.
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono">saas_pm_theme</td>
                      <td className="p-3">localStorage</td>
                      <td className="p-3 text-slate-600 dark:text-zinc-400">
                        Stores chosen display theme (Light, Dark, or System).
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono">saas_pm_accent</td>
                      <td className="p-3">localStorage</td>
                      <td className="p-3 text-slate-600 dark:text-zinc-400">
                        Stores preferred UI accent color (Indigo, Emerald, Violet, Rose, Amber, Cyan).
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 6 */}
            <section id="subprocessors" className="space-y-3 scroll-mt-28">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-500" />
                <span>6. Infrastructure &amp; Subprocessors</span>
              </h2>
              <p>
                To provide scalable, highly available enterprise services, we partner with industry-leading cloud
                providers under strict Data Processing Agreements (DPAs):
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-zinc-400">
                <li>
                  <strong className="text-slate-800 dark:text-zinc-200">Supabase (PostgreSQL &amp; Storage):</strong>{' '}
                  Managed database, real-time websockets, authentication, and encrypted file object storage.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-zinc-200">Vercel &amp; Edge Network:</strong> Edge
                  compute, proxy middleware, asset delivery, and SSL termination.
                </li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="data-ownership" className="space-y-3 scroll-mt-28">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-500" />
                <span>7. Data Ownership &amp; Retention</span>
              </h2>
              <p>
                <strong className="text-slate-900 dark:text-white">Customer Ownership:</strong> The registered
                organization maintains exclusive, complete ownership of all project tasks, department structures,
                uploaded documents, and communications.
              </p>
              <p>
                We retain company data for as long as your organization maintains an active account on the
                platform. Upon formal account closure or contract termination, tenant records and associated storage
                buckets are purged within 30 business days, following an export grace period.
              </p>
            </section>

            {/* Section 8 */}
            <section id="user-rights" className="space-y-3 scroll-mt-28">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-500" />
                <span>8. Your Rights &amp; Data Portability</span>
              </h2>
              <p>Authorized representatives and individual users enjoy full rights to:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-zinc-400">
                <li>Export comprehensive CSV task reports and department analytics at any time.</li>
                <li>Request rectification of inaccurate account details through Company Administration.</li>
                <li>Revoke employee invitations and permanently deactivate inactive user seats.</li>
                <li>Request formal deletion of personal telemetry under GDPR and CCPA guidelines.</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section id="contact" className="space-y-4 scroll-mt-28 pt-4 border-t border-slate-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-500" />
                <span>9. Contact &amp; Inquiries</span>
              </h2>
              <p>
                If your company has questions regarding our data privacy protocols, multi-tenant isolation, or
                security certifications, please contact our Data Governance Officer:
              </p>
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-1 text-xs">
                <p className="font-bold text-slate-900 dark:text-white">Adsetspro Platform Security &amp; Privacy Team</p>
                <p className="text-slate-600 dark:text-zinc-400">Email: privacy@adsetsproflow.com</p>
                <p className="text-slate-600 dark:text-zinc-400">Platform Portal: https://adsetsproflow.com</p>
              </div>
            </section>
          </article>
        </div>

        {/* Footer Navigation */}
        <footer className="pt-8 border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-zinc-400 gap-4">
          <p>© 2026 Adsetspro Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white">
              Home
            </Link>
            <span>•</span>
            <Link href="/register" className="hover:text-slate-900 dark:hover:text-white">
              Register Company
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
