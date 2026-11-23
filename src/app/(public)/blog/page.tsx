'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Calendar,
  Clock,
  Tag,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import ThemeToggle from '@/components/common/ThemeToggle';

export default function BlogListingPage() {
  const blogPosts = [
    {
      slug: 'free-online-project-management-tool',
      title: 'Free Online Project Management Tool: Simplify Teamwork with Adsetspro Flow',
      excerpt:
        'Managing projects, assigning tasks, tracking deadlines, and coordinating with team members can become challenging as a business grows. When teams depend on multiple tools, spreadsheets, and messages, important updates easily get missed. Discover how Adsetspro Flow centralizes daily operations.',
      category: 'Project Management',
      date: 'Nov 23, 2027',
      readTime: '5 min read',
      image: '/images/adsetspro_flow_blog_image.webp',
      featured: true,
      tags: ['Free Plan', 'Startup Tools', 'Team Collaboration', 'AI Workflows'],
    },
  ];

  return (
    <div className="min-h-screen bg-[#070913] text-white flex flex-col selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background ambient neon glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-[140px]" />

      {/* Top Header */}
      <header className="border-b border-white/[0.08] bg-[#070913]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-indigo-400" />
            <span>Back to Home</span>
          </Link>

          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-[#070913] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <span className="font-black text-lg tracking-tight text-white">
              Adsetspro<span className="text-cyan-400">flow</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="text-xs text-zinc-400 hover:text-white font-medium transition-colors hidden sm:inline"
            >
              Pricing
            </Link>
            <Link
              href="/contact"
              className="text-xs text-zinc-400 hover:text-white font-medium transition-colors hidden sm:inline"
            >
              Contact Us
            </Link>
            <Link
              href="/register"
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:opacity-90 transition-opacity shadow-md shadow-indigo-500/20"
            >
              Register Now
            </Link>
            <div className="pl-1 border-l border-white/10 flex items-center">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5 text-pink-400" />
            <span>Adsetspro Flow Insights &amp; Guides</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Learn, Build &amp; Scale Faster
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Practical strategies, in-depth walkthroughs, and modern project management frameworks built for agile startups and high-velocity teams.
          </p>
        </div>

        {/* Featured Article Card */}
        <div className="max-w-4xl mx-auto">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="group relative rounded-3xl bg-[#0b0f19]/90 border border-zinc-800/80 hover:border-pink-500/50 transition-all duration-300 overflow-hidden shadow-2xl hover:shadow-[0_0_50px_-10px_rgba(236,72,153,0.25)] flex flex-col"
            >
              {/* Blog Image (Full aspect-ratio 1200:630 without ANY cropping) */}
              <Link
                href={`/blog/${post.slug}`}
                className="block relative w-full aspect-[1200/630] overflow-hidden bg-[#05070d] border-b border-zinc-800/80 cursor-pointer"
              >
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-contain md:object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-pink-500/30 text-[11px] font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  <span>Featured Guide</span>
                </div>
              </Link>

              {/* Blog Content & Metadata */}
              <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mb-4">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold text-xs">
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      {post.readTime}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-3xl font-extrabold text-white group-hover:text-pink-300 transition-colors leading-tight">
                    <Link href={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </h2>

                  <p className="mt-3.5 text-xs sm:text-base text-zinc-400 leading-relaxed">
                    {post.excerpt}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] sm:text-xs px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-300 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Free 7-Day Experience Included (No Credit Card)</span>
                  </div>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-pink-500/25 group-hover:scale-105"
                  >
                    <span>Read Full Article</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-8 text-center text-xs text-zinc-500">
        <p>&copy; 2027 Adsetspro Flow. All rights reserved.</p>
      </footer>
    </div>
  );
}

