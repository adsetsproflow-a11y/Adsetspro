import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_TASKS, INITIAL_PROFILES, INITIAL_COMPANIES } from '@/lib/seed-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, companyId, userId } = body;

    if (!message || !String(message).trim()) {
      return NextResponse.json(
        { success: false, error: 'Message cannot be empty.' },
        { status: 400 }
      );
    }

    const query = String(message).trim().toLowerCase();
    const cid = companyId || 'comp-apex';
    const company = INITIAL_COMPANIES.find((c) => c.id === cid) || INITIAL_COMPANIES[0];
    const companyTasks = INITIAL_TASKS.filter((t) => t.company_id === cid);
    const companyEmployees = INITIAL_PROFILES.filter((p) => p.company_id === cid);

    const urgentTasks = companyTasks.filter((t) => t.priority === 'urgent');
    const highTasks = companyTasks.filter((t) => t.priority === 'high');
    const mediumTasks = companyTasks.filter((t) => t.priority === 'medium');
    const lowTasks = companyTasks.filter((t) => t.priority === 'low');
    const completedTasks = companyTasks.filter((t) => t.status === 'completed');

    let reply = '';

    // Smart contextual rules
    if (query.includes('high priority') || query.includes('urgent') || query.includes('priority')) {
      reply = `### 🚨 Current Priority Task Breakdown for ${company.name}\n\n` +
        `**Urgent Tasks (${urgentTasks.length}):**\n` +
        (urgentTasks.length > 0
          ? urgentTasks.map((t) => `- **${t.title}** (${t.department}) — Assigned to ${t.assigned_to}`).join('\n')
          : '- None at the moment! All urgent deliverables are cleared.\n') +
        `\n\n**High Priority Tasks (${highTasks.length}):**\n` +
        (highTasks.length > 0
          ? highTasks.map((t) => `- **${t.title}** (${t.department}) — Assigned to ${t.assigned_to}`).join('\n')
          : '- No pending high priority items.\n') +
        `\n\n**Medium/Low Priority (${mediumTasks.length + lowTasks.length}):**\n` +
        `- Medium: ${mediumTasks.length} | Low: ${lowTasks.length}\n\n` +
        `*Tip: You can filter the Task Board by clicking the "Urgent" pill on the header.*`;
    } else if (query.includes('team') || query.includes('employee') || query.includes('who') || query.includes('role') || query.includes('designation')) {
      const devCount = companyEmployees.filter((e) => e.designation === 'Developer').length;
      const desCount = companyEmployees.filter((e) => e.designation === 'Designer').length;
      const markCount = companyEmployees.filter((e) => e.designation === 'Digital Marketer').length;
      const qaCount = companyEmployees.filter((e) => e.designation === 'Tester').length;
      const writerCount = companyEmployees.filter((e) => e.designation === 'Content Writer').length;

      reply = `### 👥 ${company.name} Team Roster & Designations\n\n` +
        `We have **${companyEmployees.length} active team members**:\n` +
        `- **Developers (${devCount}):** ${companyEmployees.filter((e) => e.designation === 'Developer').map((e) => `${e.full_name} (${e.employee_id})`).join(', ') || 'None'}\n` +
        `- **Designers (${desCount}):** ${companyEmployees.filter((e) => e.designation === 'Designer').map((e) => `${e.full_name} (${e.employee_id})`).join(', ') || 'None'}\n` +
        `- **Digital Marketers (${markCount}):** ${companyEmployees.filter((e) => e.designation === 'Digital Marketer').map((e) => `${e.full_name} (${e.employee_id})`).join(', ') || 'None'}\n` +
        `- **QA Testers (${qaCount}):** ${companyEmployees.filter((e) => e.designation === 'Tester').map((e) => `${e.full_name} (${e.employee_id})`).join(', ') || 'None'}\n` +
        `- **Content Writers (${writerCount}):** ${companyEmployees.filter((e) => e.designation === 'Content Writer').map((e) => `${e.full_name} (${e.employee_id})`).join(', ') || 'None'}\n\n` +
        `*Your Company Admin can add new staff and assign custom roles anytime in the Team & Employees tab.*`;
    } else if (query.includes('webp') || query.includes('image') || query.includes('compress') || query.includes('download')) {
      reply = `### 🖼️ WebP Studio & Deliverable Assets\n\n` +
        `The built-in **WebP Studio** allows your team to:\n` +
        `1. Upload any PNG, JPG, or heavy deliverable file.\n` +
        `2. Convert to lossy/lossless WebP with up to **91%+ bandwidth compression**.\n` +
        `3. One-click **Download WebP** or download original image.\n` +
        `4. Attach optimized WebP images directly to tasks for client sign-off.\n\n` +
        `*Head over to the WebP Studio Engine tab to test conversion with the interactive quality slider!*`;
    } else if (query.includes('marketing') || query.includes('ad') || query.includes('campaign') || query.includes('copy')) {
      reply = `### 🚀 AI Ad Campaign & Copywriting Recommendations\n\n` +
        `Here are 3 high-converting ad angles for ${company.name}'s digital campaigns:\n\n` +
        `1. **Value Focus:** *"Cut your image asset bandwidth by 90% without losing a single pixel of quality. Try our WebP pipeline today."*\n` +
        `2. **Urgency Hook:** *"Sprint deadline in 1 hour? Keep your team in sync with real-time web audio chimes and automated task boards."*\n` +
        `3. **Agency Authority:** *"The enterprise PM workspace tailored for designers, developers, testers & marketers under one roof."*\n\n` +
        `*Assigned to our Digital Marketer (Priya) and Content Writer (Aisha).*`;
    } else if (query.includes('test') || query.includes('qa') || query.includes('bug') || query.includes('cypress')) {
      reply = `### 🧪 QA Testing & Validation Checkpoints\n\n` +
        `Automated test checklist for our QA Testers:\n` +
        `- [x] Multi-tenant isolation verification: cross-tenant URL rewrites blocked\n` +
        `- [x] Web Audio chime trigger: synthetic frequency synthesizer sounds on new tasks\n` +
        `- [x] WebP image drag-and-drop & download integrity\n` +
        `- [x] JWT token expiration and cookie httpOnly flags\n` +
        `- [ ] Regression test: Employee creation with custom designation\n\n` +
        `*Assigned to Tester Alex Rivera (${company.subdomain}).*`;
    } else if (query.includes('sprint') || query.includes('summary') || query.includes('leaderboard') || query.includes('xp')) {
      const topLeader = [...companyEmployees].sort((a, b) => b.total_xp - a.total_xp)[0];
      reply = `### 🏆 Sprint Health & Leaderboard Status for ${company.name}\n\n` +
        `- **Total Tasks Active:** ${companyTasks.length}\n` +
        `- **Completed Deliverables:** ${completedTasks.length} (${Math.round((completedTasks.length / (companyTasks.length || 1)) * 100)}% velocity)\n` +
        `- **Current 1st Place Champion:** 🥇 **${topLeader?.full_name}** with **${topLeader?.total_xp} XP** (${topLeader?.designation})!\n` +
        `- **Streak Multiplier:** Team members with active streaks receive 1.5x XP multipliers.\n\n` +
        `*Check the Gamified Leaderboard & Graphs tab for interactive priority and department visual charts!*`;
    } else {
      reply = `Hello! I'm **TaskBot AI Copilot** for **${company.name}**.\n\n` +
        `I can help you with:\n` +
        `- **Priority Tasks:** Ask *"What are our high priority tasks?"* or *"Show urgent tasks"*\n` +
        `- **Team Directory:** Ask *"Who are our Developers, Testers, Designers?"*\n` +
        `- **Image Optimization:** Ask *"How do I upload and download WebP images?"*\n` +
        `- **Digital Marketing:** Ask *"Give me marketing ad copy ideas"*\n` +
        `- **QA Testing:** Ask *"What is our QA test checklist?"*\n` +
        `- **Sprint Summary:** Ask *"Summarize our sprint leaderboard and velocity"*\n\n` +
        `How can I assist your workflow today?`;
    }

    return NextResponse.json({
      success: true,
      sender: 'TaskBot AI Copilot',
      response: reply,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'ChatBot processing error.' },
      { status: 500 }
    );
  }
}
