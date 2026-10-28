import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

function getLiveGeminiApiKey(): string {
  // 1. Read directly from .env.local / .env first so changes to env files take effect immediately without restarting the dev server
  try {
    for (const filename of ['.env.local', '.env']) {
      const fullPath = path.join(process.cwd(), filename);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const match = content.match(/GEMINI_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/);
        if (match && match[1] && match[1].trim() !== '') {
          return match[1].trim();
        }
      }
    }
  } catch (err) {
    console.warn('Error reading env files for GEMINI_API_KEY:', err);
  }

  // 2. Fallback to process.env if files are absent
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
    return process.env.GEMINI_API_KEY.trim();
  }

  return '';
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, currentDescription, department, priority } = body;

    const userInput = [title, currentDescription].filter(Boolean).join(' - ').trim();

    if (!userInput) {
      return NextResponse.json(
        { error: 'Please enter a Task Title or draft notes so Gemini can enhance it.' },
        { status: 400 }
      );
    }

    const geminiApiKey = getLiveGeminiApiKey();
    console.log('[DEBUG Gemini Key]:', geminiApiKey ? geminiApiKey.slice(0, 12) + '...' : 'EMPTY');

    const prompt = `You are a senior Product Manager and technical lead in a modern enterprise project management platform.
The user provided draft notes or a task topic (which may be brief, informal, or contain typos):
Input Notes: "${currentDescription || title}"
${title && currentDescription ? `Task Title Provided: "${title}"` : ''}
${department ? `Department Context: ${department}` : ''}
${priority ? `Priority: ${priority}` : ''}

Your instructions:
1. Interpret the user's intent intelligently. For informal phrasing or typos (e.g. "heis good to builf" -> ready to build/develop core feature implementation), expand it into an actionable technical deliverable.
2. Produce a professional task title and structured specification.

Format your response strictly as follows:
TITLE: [Concise 3-7 word task title]
DESCRIPTION:
### 🎯 Objective
[Clear 1-2 sentence summary of what needs to be delivered and why]

### 📋 Key Deliverables & Scope
- [Action item 1]
- [Action item 2]
- [Action item 3]

### ✅ Acceptance Criteria
- [Verifiable criterion 1]
- [Verifiable criterion 2]
- [Verifiable criterion 3]

### 💡 Implementation Guidelines & Edge Cases
- [Technical, workflow, or architecture consideration]

Important:
- Return ONLY the TITLE: and DESCRIPTION: sections.
- Do not output conversational filler (no "Sure! Here is...").`;

    let isRateLimited = false;

    // Smart fallback title and description if AI servers are unreachable or rate-limited
    let smartTitle = title || '';
    if (!smartTitle && currentDescription) {
      const lower = currentDescription.toLowerCase();
      if (/buil[fd]|develop|code|implement/i.test(lower)) {
        smartTitle = 'Core Feature Development & Implementation';
      } else if (/design|figma|ui|ux|mockup/i.test(lower)) {
        smartTitle = 'UI/UX Design & Interface Prototyping';
      } else if (/bug|fix|error|issue|defect/i.test(lower)) {
        smartTitle = 'Bug Investigation & Issue Resolution';
      } else if (/test|qa|verify|spec/i.test(lower)) {
        smartTitle = 'Quality Assurance & Specification Verification';
      } else {
        const words = currentDescription.replace(/[^a-zA-Z0-9 ]/g, '').split(/\s+/).slice(0, 5).join(' ');
        smartTitle = words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Deliverable Execution & Task Scope';
      }
    }
    const fallbackTitle = smartTitle || 'Execute Feature Implementation';
    const fallbackDesc = `### 🎯 Objective
${smartTitle ? `Deliver and validate: ${smartTitle}` : 'Develop and deliver the requested task deliverables to standard.'}

### 📋 Key Deliverables & Scope
- Scope and requirements: ${currentDescription || title || 'Core deliverable'}.
- Implement responsive components, state management, and clear UI interactions.
- Validate end-to-end functionality across target scenarios.

### ✅ Acceptance Criteria
- Meets all visual and functional design specifications.
- Verified across desktop and mobile viewports with zero regressions.
- Passes all acceptance and reviewer validation checks.

### 💡 Implementation Guidelines & Edge Cases
- Adhere to project architecture conventions and accessibility guidelines.`;

    if (geminiApiKey) {
      // Prioritize active model with verified quota
      const candidateModels = [
        'gemini-3-flash-preview',
        'gemini-3.5-flash',
        'gemini-3.6-flash',
        'gemini-3.8-flash',
      ];

      for (const model of candidateModels) {
        try {
          const res = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
            method: 'POST',
            headers: {
              'x-goog-api-key': geminiApiKey,
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(20000),
            body: JSON.stringify({
              model,
              input: prompt,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const outputStep = data?.steps?.find((s: any) => s.type === 'model_output');
            const rawText = outputStep?.content?.[0]?.text;

            if (rawText) {
              let suggestedTitle = '';
              let enhancedDescription = rawText.trim();

              const titleMatch = rawText.match(/TITLE:\s*([^\r\n]+)/i);
              if (titleMatch && titleMatch[1]) {
                suggestedTitle = titleMatch[1].trim();
              }

              const descMatch = rawText.match(/DESCRIPTION:\s*([\s\S]+)/i);
              if (descMatch && descMatch[1]) {
                enhancedDescription = descMatch[1].trim();
              } else if (titleMatch) {
                enhancedDescription = rawText.replace(/TITLE:\s*[^\r\n]+/i, '').trim();
              }

              return NextResponse.json({
                success: true,
                suggestedTitle: suggestedTitle || undefined,
                enhancedDescription,
                provider: model,
              });
            }
          } else {
            if (res.status === 429) {
              isRateLimited = true;
            }
          }
        } catch (mErr: any) {
          console.warn(`[Gemini Model ${model}] Error:`, mErr?.message);
        }
      }

      // Secondary fallback to generateContent on gemini-3-flash-preview
      try {
        const genRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(20000),
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        );

        if (genRes.ok) {
          const genData = await genRes.json();
          const rawText = genData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            let suggestedTitle = '';
            let enhancedDescription = rawText.trim();

            const titleMatch = rawText.match(/TITLE:\s*([^\r\n]+)/i);
            if (titleMatch && titleMatch[1]) {
              suggestedTitle = titleMatch[1].trim();
            }

            const descMatch = rawText.match(/DESCRIPTION:\s*([\s\S]+)/i);
            if (descMatch && descMatch[1]) {
              enhancedDescription = descMatch[1].trim();
            } else if (titleMatch) {
              enhancedDescription = rawText.replace(/TITLE:\s*[^\r\n]+/i, '').trim();
            }

            return NextResponse.json({
              success: true,
              suggestedTitle: suggestedTitle || undefined,
              enhancedDescription,
              provider: 'gemini-3-flash-preview',
            });
          }
        } else if (genRes.status === 429) {
          isRateLimited = true;
        }
      } catch (genErr) {
        console.warn('[Gemini generateContent Fallback Error]:', genErr);
      }
    }

    return NextResponse.json({
      success: true,
      suggestedTitle: fallbackTitle,
      enhancedDescription: fallbackDesc,
      provider: 'template-fallback',
      isRateLimited,
      apiKeyMissing: !geminiApiKey,
    });
  } catch (error: any) {
    console.error('Error enhancing task description:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
