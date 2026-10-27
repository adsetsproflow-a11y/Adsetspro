import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  FileText,
  Building2,
  Users,
  ShieldAlert,
  HardDrive,
  Clock,
  Scale,
  Ban,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | Adsetspro Platform',
  description:
    'Review the Master Service Agreement and Enterprise Terms of Service governing the use of Adsetspro Platform multi-tenant task and project orchestration software.',
};

export default function TermsOfServicePage() {
  const lastUpdated = 'October 27, 2026';

  const sections = [
    { id: 'acceptance', title: '1. Acceptance & Enterprise Agreement' },
    { id: 'tenancy', title: '2. Multi-Tenant Account Registration' },
    { id: 'roles', title: '3. Role Hierarchy & User Conduct' },
    { id: 'ip', title: '4. Intellectual Property & Customer Assets' },
    { id: 'storage', title: '5. File Uploads & Fair Use (50MB Cap)' },
    { id: 'availability', title: '6. Service Levels & Maintenance' },
    { id: 'fees', title: '7. Subscriptions & Billing' },
    { id: 'liability', title: '8. Disclaimers & Limitation of Liability' },
    { id: 'termination', title: '9. Suspension & Account Termination' },
    { id: 'general', title: '10. Governing Law & Miscellaneous' },
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
            <FileText className="w-4 h-4" />
            <span>Master Service Agreement</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            Adsetspro Platform Terms of Service
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
            These Terms of Service (&quot;Agreement&quot;) constitute a legally binding agreement between your
            organization (&quot;Customer&quot;, &quot;Company&quot;, or &quot;You&quot;) and Adsetspro Platform
            (&quot;Adsetspro&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), governing your use of our
            multi-tenant SaaS project and task management software.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-500 dark:text-zinc-400">
            <span className="font-mono bg-slate-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
              Effective Date: {lastUpdated}
            </span>
            <span>•</span>
            <span className="font-mono bg-slate-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
              Edition: Enterprise Multi-Tenant
            </span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Legally Binding
            </span>
          </div>
        </header>

        {/* Main Content Layout with Sticky Quick-Nav */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Quick Nav Sidebar (Desktop) */}
          <aside className="hidden lg:block col-span-1">
            <div className="sticky top-28 p-4 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Clauses
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

          {/* Terms Document Body */}
          <article className="col-span-1 lg:col-span-3 space-y-10 text-sm leading-relaxed text-slate-700 dark:text-zinc-300">
            {/* Section 1 */}
            <section id="acceptance" className="space-y-3 scroll-mt-28">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                <span>1. Acceptance &amp; Enterprise Agreement</span>
              </h2>
              <p>
                By registering an organization, creating an administrative account, clicking &quot;I agree to the
                Enterprise Service Agreement&quot;, or permitting authorized personnel to access Adsetspro Platform,
                you affirm that you possess full corporate authority to bind your organization to these Terms.
              </p>
              <p>
                If you do not agree to all terms herein, you must immediately refrain from creating an account or
                using any part of the service.
              </p>
            </section>

            {/* Section 2 */}
            <section id="tenancy" className="space-y-3 scroll-mt-28">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-500" />
                <span>2. Multi-Tenant Account Registration</span>
              </h2>
              <p>
                During organization registration, the primary registrant creates an isolated corporate tenant
                domain identifiable by a unique company slug (<code className="text-xs font-mono bg-slate-200/70 dark:bg-zinc-800 px-1 py-0.5 rounded">/c/[companySlug]</code>).
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-zinc-400">
                <li>
                  <strong className="text-slate-800 dark:text-zinc-200">Accuracy of Information:</strong> The
                  Customer agrees to maintain truthful and verified corporate information, including corporate
                  domain emails.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-zinc-200">Tenant Slug Ownership:</strong> We reserve
                  the right to reclaim company slugs that infringe on third-party trademarks or mislead other
                  tenants.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-zinc-200">Credential Confidentiality:</strong>{' '}
                  Administrators are solely responsible for all actions conducted under their issued team accounts.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="roles" className="space-y-3 scroll-mt-28">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                <span>3. Role Hierarchy &amp; User Conduct</span>
              </h2>
              <p>
                Adsetspro Platform operates on strict hierarchical delegation. Customers must enforce appropriate
                credential hygiene according to assigned tiers:
              </p>
              <div className="space-y-2.5 pt-2">
                <div className="p-3 rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800">
                  <span className="font-bold text-xs text-red-500 dark:text-red-400">Super Administrator</span>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Platform maintenance, global company approvals, tenant suspension, and cross-platform health
                    monitoring.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800">
                  <span className="font-bold text-xs text-indigo-500 dark:text-indigo-400">Company Administrator</span>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Department creation, team member invitations, designation schemes, project governance, and company
                    branding.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800">
                  <span className="font-bold text-xs text-amber-500 dark:text-amber-400">Department Head</span>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Departmental task assignment, peer review oversight, revision loops, and team productivity
                    reporting.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800">
                  <span className="font-bold text-xs text-emerald-500 dark:text-emerald-400">Employee</span>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Task execution, deliverable uploads, status transitions, review submissions, and direct team
                    chat.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="ip" className="space-y-3 scroll-mt-28">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-500" />
                <span>4. Intellectual Property &amp; Customer Assets</span>
              </h2>
              <p>
                <strong className="text-slate-900 dark:text-white">Customer Data:</strong> All rights, title, and
                interest in task data, company logos, internal communications, documents, and deliverables remain the
                exclusive property of the Customer.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">Platform Software:</strong> Adsetspro Platform,
                including its code, user interface designs, dynamic theming engine, notification audio triggers, and
                database schema, is protected by international intellectual property laws and belongs exclusively to
                Adsetspro.
              </p>
            </section>

            {/* Section 5 */}
            <section id="storage" className="space-y-3 scroll-mt-28">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-indigo-500" />
                <span>5. File Uploads &amp; Fair Use (50MB Cap)</span>
              </h2>
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span>Individual File Size Limit: 50MB</span>
                </div>
                <p>
                  Any deliverable, task attachment, or chat file exceeding 50MB per upload will be automatically
                  rejected by cloud storage gateways.
                </p>
              </div>
              <p>Customers agree not to upload:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-zinc-400 text-xs">
                <li>Malware, viruses, ransomware, or executable scripts designed to compromise the infrastructure.</li>
                <li>Content that violates copyright, trade secrets, or privacy rights of any third party.</li>
                <li>Excessive automated script uploads that degrade system resources for other tenants.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="availability" className="space-y-3 scroll-mt-28">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                <span>6. Service Levels &amp; Maintenance</span>
              </h2>
              <p>
                We strive to maintain a 99.9% platform availability target. Scheduled maintenance windows are
                announced in advance via administrative notification banners. Emergency hotfixes and security patches
                may be deployed without prior notice to ensure infrastructure integrity.
              </p>
            </section>

            {/* Section 7 */}
            <section id="fees" className="space-y-3 scroll-mt-28">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-500" />
                <span>7. Subscriptions &amp; Billing</span>
              </h2>
              <p>
                Subscription plans are billed according to active employee seats and storage tiers. Upgrades take
                effect immediately. Non-payment of subscription dues after a 14-day notice period may lead to
                temporary workspace restriction.
              </p>
            </section>

            {/* Section 8 */}
            <section id="liability" className="space-y-3 scroll-mt-28">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-500" />
                <span>8. Disclaimers &amp; Limitation of Liability</span>
              </h2>
              <p className="uppercase text-xs font-semibold text-slate-500 dark:text-zinc-400">
                To the maximum extent permitted by applicable law:
              </p>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Adsetspro Platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any
                kind. Under no circumstances will Adsetspro be liable for lost profits, loss of business reputation,
                indirect, incidental, or consequential damages arising out of tenant system downtime or employee
                conduct.
              </p>
            </section>

            {/* Section 9 */}
            <section id="termination" className="space-y-3 scroll-mt-28">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Ban className="w-5 h-5 text-indigo-500" />
                <span>9. Suspension &amp; Account Termination</span>
              </h2>
              <p>
                Super Administrators reserve the explicit right to suspend or permanently terminate tenant
                organizations found in material breach of security rules, fair use guidelines, or legal compliance.
              </p>
              <p>
                Upon voluntary termination, the Company Administrator may request a complete CSV export of projects,
                tasks, and audit records within 30 days prior to permanent tenant purging.
              </p>
            </section>

            {/* Section 10 */}
            <section id="general" className="space-y-4 scroll-mt-28 pt-4 border-t border-slate-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-500" />
                <span>10. Governing Law &amp; Miscellaneous</span>
              </h2>
              <p>
                These Terms are governed by and construed in accordance with the laws of the applicable jurisdiction,
                without regard to conflict of law principles. Any dispute arising out of this Agreement will be
                resolved through binding arbitration.
              </p>
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-1 text-xs">
                <p className="font-bold text-slate-900 dark:text-white">Legal &amp; Contracts Department</p>
                <p className="text-slate-600 dark:text-zinc-400">Email: legal@adsetsproflow.com</p>
                <p className="text-slate-600 dark:text-zinc-400">Adsetspro Platform · Enterprise Cloud Operations</p>
              </div>
            </section>
          </article>
        </div>

        {/* Footer Navigation */}
        <footer className="pt-8 border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-zinc-400 gap-4">
          <p>© 2026 Adsetspro Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white">
              Home
            </Link>
            <span>•</span>
            <Link href="/login" className="hover:text-slate-900 dark:hover:text-white">
              Sign In
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
