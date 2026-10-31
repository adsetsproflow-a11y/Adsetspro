'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  CheckSquare,
  Users,
  Briefcase,
  Building,
  X,
  Command,
  ArrowRight,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface SearchResultTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  href: string;
}

interface SearchResultEmployee {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  role: string;
  href: string;
}

interface SearchResultProject {
  id: string;
  name: string;
  status: string;
  href: string;
}

interface SearchResultDepartment {
  id: string;
  name: string;
  description: string | null;
  status: string;
  href: string;
}

interface SearchResults {
  tasks: SearchResultTask[];
  employees: SearchResultEmployee[];
  projects: SearchResultProject[];
  departments: SearchResultDepartment[];
}

interface GlobalSearchProps {
  companySlug: string;
}

export default function GlobalSearch({ companySlug }: GlobalSearchProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({
    tasks: [],
    employees: [],
    projects: [],
    departments: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'tasks' | 'employees' | 'projects' | 'departments'>('all');

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for Ctrl+K / Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setResults({ tasks: [], employees: [], projects: [], departments: [] });
    }
  }, [isOpen]);

  // Debounced search query
  useEffect(() => {
    if (!query.trim()) {
      setResults({ tasks: [], employees: [], projects: [], departments: [] });
      setIsLoading(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsLoading(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/companies/${companySlug}/search?q=${encodeURIComponent(query.trim())}`
        );
        const data = await res.json();
        if (data.success && data.results) {
          setResults(data.results);
        }
      } catch (err) {
        console.error('Search fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, companySlug]);

  const handleSelectResult = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const totalResultsCount =
    results.tasks.length +
    results.employees.length +
    results.projects.length +
    results.departments.length;

  return (
    <>
      {/* Search Trigger Button for Header */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs transition-all cursor-pointer group shadow-inner"
        title="Quick Search (Ctrl + K)"
      >
        <Search className="w-3.5 h-3.5 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
        <span className="hidden sm:inline font-medium">Search workspace...</span>
        <span className="sm:hidden font-medium">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-950 border border-zinc-800 text-zinc-400">
          <span className="text-[9px]">Ctrl</span> K
        </kbd>
      </button>

      {/* Global Search Dialog Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className="w-full max-w-2xl bg-zinc-950/95 border border-zinc-800/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
              <Search className="w-5 h-5 text-indigo-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search tasks, colleagues, projects, or departments..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
              {isLoading && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />}
              {query && !isLoading && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400 hover:text-white shrink-0"
              >
                ESC
              </button>
            </div>

            {/* Filter Tabs */}
            {query.trim().length > 0 && totalResultsCount > 0 && (
              <div className="flex items-center gap-1.5 px-5 py-2.5 bg-zinc-900/30 border-b border-zinc-800/50 overflow-x-auto text-[11px] font-semibold">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    activeCategory === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  All ({totalResultsCount})
                </button>
                {results.tasks.length > 0 && (
                  <button
                    onClick={() => setActiveCategory('tasks')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      activeCategory === 'tasks'
                        ? 'bg-indigo-600 text-white'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    Tasks ({results.tasks.length})
                  </button>
                )}
                {results.employees.length > 0 && (
                  <button
                    onClick={() => setActiveCategory('employees')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      activeCategory === 'employees'
                        ? 'bg-indigo-600 text-white'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    Employees ({results.employees.length})
                  </button>
                )}
                {results.projects.length > 0 && (
                  <button
                    onClick={() => setActiveCategory('projects')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      activeCategory === 'projects'
                        ? 'bg-indigo-600 text-white'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    Projects ({results.projects.length})
                  </button>
                )}
                {results.departments.length > 0 && (
                  <button
                    onClick={() => setActiveCategory('departments')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      activeCategory === 'departments'
                        ? 'bg-indigo-600 text-white'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    Departments ({results.departments.length})
                  </button>
                )}
              </div>
            )}

            {/* Results Content List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Empty query state */}
              {!query.trim() && (
                <div className="py-12 px-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Quick Workspace Search</h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    Type to search across tasks, employees, departments, and projects. Results are filtered by your workspace role.
                  </p>
                </div>
              )}

              {/* No results state */}
              {query.trim() && !isLoading && totalResultsCount === 0 && (
                <div className="py-12 px-6 text-center space-y-2">
                  <Search className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-sm font-semibold text-zinc-300">No results found for &quot;{query}&quot;</p>
                  <p className="text-xs text-zinc-500">
                    Try checking for spelling or using different keywords.
                  </p>
                </div>
              )}

              {/* Category: Tasks */}
              {(activeCategory === 'all' || activeCategory === 'tasks') && results.tasks.length > 0 && (
                <div className="space-y-1.5">
                  <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                    Tasks ({results.tasks.length})
                  </span>
                  {results.tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleSelectResult(task.href)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-900/40 hover:bg-indigo-600/15 border border-zinc-800/60 hover:border-indigo-500/40 transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
                          <CheckSquare className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase whitespace-nowrap">
                              {task.status.replace(/_/g, ' ')}
                            </span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-[10px] text-zinc-500 uppercase">
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              )}

              {/* Category: Employees */}
              {(activeCategory === 'all' || activeCategory === 'employees') && results.employees.length > 0 && (
                <div className="space-y-1.5">
                  <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                    Colleagues & Team ({results.employees.length})
                  </span>
                  {results.employees.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => handleSelectResult(emp.href)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-900/40 hover:bg-indigo-600/15 border border-zinc-800/60 hover:border-indigo-500/40 transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">
                            {emp.name}
                          </p>
                          <p className="text-[10px] text-zinc-500 truncate font-mono">
                            {emp.email || emp.role.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                        {emp.role.replace('_', ' ')}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Category: Projects */}
              {(activeCategory === 'all' || activeCategory === 'projects') && results.projects.length > 0 && (
                <div className="space-y-1.5">
                  <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                    Projects ({results.projects.length})
                  </span>
                  {results.projects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => handleSelectResult(proj.href)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-900/40 hover:bg-indigo-600/15 border border-zinc-800/60 hover:border-indigo-500/40 transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">
                            {proj.name}
                          </p>
                          <span className="text-[10px] text-zinc-500 uppercase font-mono">
                            Status: {proj.status}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-cyan-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              )}

              {/* Category: Departments */}
              {(activeCategory === 'all' || activeCategory === 'departments') && results.departments.length > 0 && (
                <div className="space-y-1.5">
                  <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                    Departments ({results.departments.length})
                  </span>
                  {results.departments.map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => handleSelectResult(dept.href)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-900/40 hover:bg-indigo-600/15 border border-zinc-800/60 hover:border-indigo-500/40 transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                          <Building className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">
                            {dept.name}
                          </p>
                          {dept.description && (
                            <p className="text-[10px] text-zinc-500 truncate">
                              {dept.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {dept.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between text-[11px] text-zinc-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 rounded bg-zinc-950 border border-zinc-800 text-[10px]">↑</kbd>
                  <kbd className="px-1 rounded bg-zinc-950 border border-zinc-800 text-[10px]">↓</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 rounded bg-zinc-950 border border-zinc-800 text-[10px]">↵</kbd>
                  to select
                </span>
              </div>
              <span className="font-mono">Global Tenant Scope</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
