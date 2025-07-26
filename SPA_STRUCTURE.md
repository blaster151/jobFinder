# SPA Structure & Routes

## Component/View Breakdown

| Component/View | SPA Route? | Type | Details |
|----------------|------------|------|---------|
| Job Detail View | ✅ `/jobs/:id` | Page | Shows job details, status, linked contacts, actions |
| Contact View | ✅ `/contacts/:id` | Page | Timeline of interactions, contact info, job links |
| Daily Summary Panel | ❌ `/` (or dashboard) | Section | Recaps recent actions, quotes, nudges |
| Reminder Panel | ❌ Modal or Sidebar | Component | Can be global or job-specific |
| Profile Builder | ✅ `/profile` | Multi-step Form | Creates "me" + "dream job" profile |
| Prompt Suggestion Box | ❌ Drawer / modal | Utility Component | "Ask ChatGPT…" modal shown contextually |

## Route Structure

### Main Routes
- `/` - Dashboard with Daily Summary Panel
- `/jobs/:id` - Job Detail View
- `/contacts/:id` - Contact View  
- `/profile` - Profile Builder

### Modal/Drawer Components
- Reminder Panel (global or job-specific)
- Prompt Suggestion Box (contextual)
- Contact creation/editing
- Interaction creation/editing

## Implementation Notes

- **Daily Summary Panel**: Embedded in dashboard, shows recent activity and encouragement
- **Reminder Panel**: Can be triggered globally or from specific job/contact contexts
- **Prompt Suggestion Box**: Context-aware modal that appears based on current view
- **Profile Builder**: Multi-step form for user profile and job preferences 