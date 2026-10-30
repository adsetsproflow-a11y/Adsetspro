import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme/ThemeContext';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://adsetsproflow.com'),
  title: 'Adsetspro Flow - Multi-Tenant SaaS Platform & Project Suite',
  description: 'Adsetspro Flow - Multi-Tenant SaaS Project Management with Web Audio Alarms, WebP Studio, Gamified Leaderboard, and Dynamic Tenant Isolation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased light"
      data-theme="light"
      data-accent="indigo"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('saas_pm_theme') || 'light';
                const accent = localStorage.getItem('saas_pm_accent') || 'indigo';
                const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                  document.documentElement.setAttribute('data-theme', 'dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.setAttribute('data-theme', 'light');
                  document.documentElement.style.colorScheme = 'light';
                }
                document.documentElement.setAttribute('data-accent', accent);
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-zinc-100 transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
