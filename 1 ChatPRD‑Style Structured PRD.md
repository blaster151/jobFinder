This isn't just a tracker, it’s an **externalized memory, coach, and emotional support layer**. It should feel like a headhunter who can kick ass and gives the best hugs.

A tactical recruiter who knows your goals, logs every whisper, gently nudges your better angels, and reminds you you’re not alone.

## 🚀 Step 1: ChatPRD‑Style Structured PRD

### **1. Problem Statement**

You're a skilled, experienced developer struggling to find a remote role via crowded portals. Applications vanish in spammed listings, overwhelm sets in, follow-ups slip through cracks, and it’s hard to prioritize effectively among board posts, referrals, and recruiter outreach.

### **2. User Personas**

- **Solo Job‑Seeker** (you initially): seeks high‑signal remote roles, anxious about follow-ups, desires proactive reminders and clarity.
- **Future SaaS Users** (friends or network peers): want accessible, coach‑enabled job search tracking and prioritization tools without needing custom templates.

### **3. Vision & Differentiation**

A targeted assistant for job search: not just an application tracker but a dynamic coach. It sources from all channels (big boards, niche listings, headhunters, referrals), dedupes and prioritizes, refines your “me” and “dream‑job” profiles over time, triages emails or pasted boards, and nudges you to take action proactively.

### **4. Key Features**

- **Profile Builder**: “Me Profile” (skills, experience, remote preferences) and “Dream Traits” (company size, stack, culture, compensation).
- **Multi‑Channel Intake**: import from Hacker News Who’s Hiring threads, Wellfound, LinkedIn, niche boards, recruiter emails/headhunters.
- **Deduplication & Prioritization**: identify new listings vs duplicates; highlight listings outside major boards; flag recruiter‑hidden listings by inference.
- **Job Dashboard**: filter by profile match, source confidence, freshness; show new-to-you opportunities.
- **Manual Response Tracking**: mark applied, responded, interview; see counts and follow‑up due dates.
- **Reminder & Coaching Engine**: nudges for follow‑up, suggestions for reaching out to recruiters, refine your traits profile based on feedback.
- **Referral & Company Flagging**: flag companies you know someone at, tag dream gigs, revisit their career pages.
- **Parsing Assistant**: take pasted job-post lists and parse via LLM calls into structured job records.
- **Export/Import / SaaS Readiness**: JSON or SQL store that can scale into multi-user support later.
- **Browser Extension (stretch)**: autocomplete job application portals like Greenhouse with your resume data to reduce repetitive form entries.

### **5. Success Metrics**

- **Short-Term (MVP)**: ~20 jobs triaged/week; follow‑up reminders generated; job response tracking; user logs follow‑up actions.
- **Longer-Term (Productization)**: active users >10; referral conversions; job match precision; job profile refinements; retention at >50% over 2 weeks.

### **6. Technical Scope**

- **Stack**: Next.js + TypeScript (React), Vitest, Zustand + Zod, shadcn components, Tailwind CSS.
- **Storage**: MVP: local JSON files; Upgrade: SQLite or Postgres. User table initially single row (userId=1); design for multi-user later.

### **7. Technical Architecture (Mermaid)**

```
mermaidCopyEditflowchart LR
  A[Input Source:\nHacker News paste,\nWellfound JSON,\nRecruiter email logs] --> B[JobParser \n(Zod validation, LLM extraction)]
  B --> C(JobStore: JSON/SQLite/Postgres)
  C --> D[Zustand & Dashboard UI\n(filtering, prioritization)]
  C --> E[ReminderScheduler\n(setTimeout/cron)]
  C --> F[ProfileEngine\n"me profiles" & traits]
  F --> D
  F --> E
  C --> G[Response Tracking UI]
  subgraph future
    C --> H[Browser Extension]
  end
```

### **8. Data Model (Schemas)**

- **User**: `{ userId, name, email, meProfileJSON, traitProfileJSON }`
- **Company**: `{ id, name, flagged, referralSource }`
- **Job**: `{ id, title, companyId, sourceChannel, sourceUrl, postedDate, traits, rawDescription, parsedMatchScore, seenAt }`
- **Submission**: `{ id, jobId, userId, appliedDate, status, followUpDate, notes }`
- **Reminder**: `{ id, submissionId, type, dueDate, sent: boolean }`

### **9. Operational & UX Needs**

- Clear import interface (paste or file upload).
- Dashboard filtering and sort (new only, high-match, company-flagged).
- Reminder ui and simple cron logic.
- Option to migrate store from JSON to SQLite easily.
- Vitest coverage for parser and matcher.
- Ability to export/import data for backup or sharing.

### **10. Risks & Mitigations**

- **LLM parsing inaccuracies** → use Zod schema to validate and allow manual edits.
- **Deduplication false positives** → allow override or merge, fuzzy matching thresholds.
- **Reminder reliability** → backup persistence and UI to reschedule if missed.
- **Privacy** → keep initial system offline and local, local JSON store; later add encryption or SaaS login.

### **11. Communication-Level Tracking (High Priority)**

> **Goal**: Ensure *lossless memory* of conversations, across all mediums.

**Features to add**:

- `Contact` entity: name, email, phone, LinkedIn, company, role, notes
- `Interaction` log: timestamped messages (e.g., email, call, DM), medium, summary
- Link `Interactions` to a `Submission`, `Company`, or `Job`
- UI: Threaded comm log view per person or job
- Follow-up triggers: auto-suggest next steps based on last contact date

------

### **12. Poor Man’s LLM Integration**

> **Goal**: Guide you to smart prompts, without needing LLM API keys or infrastructure.

**Behavior**:

- At relevant junctures (e.g., parsing a job, drafting a message), the tool says:

  > 🧠 “Ask ChatGPT: *‘Summarize this job description as 3 key priorities the company probably cares about most.’*”

- You paste the response back into the tool.

- Optionally log that as a note, persona refinement, or updated `Job.traits`.

------

### **13. Emotional Boost & Encouragement**

> **Goal**: Lift spirits during discouragement or overwhelm.

**Behavior**:

- Periodically (configurable), offer contextual support:
  - “📬 You’ve applied to 6 jobs this week. That’s real movement.”
  - “💬 Want to follow up with one company today? Little steps.”
  - “📖 ‘Success is not final, failure is not fatal: it is the courage to continue that counts.’ —Winston Churchill”
- Library of quotes/stories to pull from (can be tagged by theme: resilience, luck, rejection, progress).
- Optional affirmations module for custom reminders like: *“You’re building something better than a spreadsheet.”





### 🧠 Feature Summary Table (Updated)

| Category             | Feature                                                      |
| -------------------- | ------------------------------------------------------------ |
| Job tracking         | Multi-source intake, deduplication, filtering, submission tracking |
| Communication memory | Recruiter/HM contacts, per-job logs, timestamps, follow-up suggestions |
| Profile intelligence | “Me” and “Attractive Job” profiles, refined via feedback     |
| Reminders & coaching | Follow-up nudges, reflection prompts, low-lift progress actions |
| Emotional support    | Smart quotes, affirmations, momentum reflections             |
| LLM assist           | “Ask ChatGPT” prompt library to bridge parsing, analysis, messaging |

## References

Origin thread: https://chatgpt.com/c/688434fc-5208-8325-acae-13e59155d1da


ChatGPT "Would You Like?" Offers

Would you like:

- (DONE) A `ContactForm` component next for creating/editing?
- Or the **Interaction Add** UI tied into the contact page?
- Or to wire up `reminders` next from overdue interactions?

Want

​	the `InteractionForm` next so you can log email/DM/phone call entries for that contact? 

​	(DONE) wiring this into the job submission flow first?

## ✅ Do You Want Me To…

1. **Build `JobSubmissionModal.tsx` next**?
2. Focus first on **`ContactSelect` component** to support that modal?
3. Or wire `addSubmission()` + `addInteraction()` functions with mock JSON first?



Would you like:

- The `InteractionForm` next to log email/DM/etc. with that selected contact?

- Or now wire this into a basic `JobSubmissionModal` stub so you can see it all come together?

- 

- Would you like me to:

  - (DONE) Turn this into a full page (`pages/reminders.tsx`)?
  - Add a global navbar with a 🔔 icon that highlights when something’s due?
  - (DONE) Add the ability to dismiss/snooze a reminder inline?

- 

- 🧭 Optional Next Steps

  Want me to add:

  - (DONE) A 🔔 **navbar badge** when reminders exist?
  - (DONE) A "Mark Done" or "Snooze" button per item?
  - (DONE) A weekly view of upcoming follow-ups, not just overdue?

- 

- 

- Would you like:

  - (DONE) To auto-hide the badge if you’re *on* `/reminders` already?
  - (DONE) To also show “Reminders due in the next 3 days” (not just overdue)?
  - A sidebar version for mobile/responsive view?

- 

- 

- Would you like:

  - Sound/Vibration via browser notification if one becomes due while the page is open?
  - A persistent toast on due dates?

- 

- Would you like a **calendar grid** style weekly view eventually? Or is a list grouped by date (e.g., headers like “Monday, July 28”) better for now?

- 

- 

- Want a date picker modal for custom snooze as the next enhancement, or navbar badge wiring?

  

  Scaffolded and ready! You've now got an `InteractionSection` with:

  - A selectable **interaction type**
  - A **textarea for notes**
  - A visual **log of past interactions**
  - Placeholder for future filtering, reminder creation, or per-contact wiring

  Let me know if you want to:

  - Connect this to a specific contact ID
  - Save interactions to a store or backend
  - Add reminder spinoffs directly from interactions
  - Style this differently or use animations (e.g. for added rows)

  

  

  ## Stretch Ideas (Optional)

  - Add dismiss/archive button (`followUpRequired = false`)

  - Add snooze: “remind me again in 3 days”

  - Filter by “due today,” “due this week,” “overdue”

  - Later: daily cron job or notification system

    

    ### 