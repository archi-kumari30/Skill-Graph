# SkillGraph: AI Career Assistant & Mentorship Context

## 1. Module Name
**AI Career Assistant & Mentorship Module**

---

## 2. Purpose
The AI Career Assistant & Mentorship module delivers contextual, personalized career coaching directly inside the SkillGraph platform. Rather than serving as a generic chatbot, it grounds its responses in the learner's live profile, technical skills inventory, target career role, computed skill gaps, completed topic checklists, active course enrollments, and matched job opportunities using Google's Gemini language model.

---

## 3. Current Functionality
- **Context-Aware Dynamic Prompt Synthesis (`aiService.js`)**:
  - Automatically queries the learner's entire data footprint on each chat interaction:
    - **Student Background**: Name, department, college, branch, year of study.
    - **Target Career Goal**: Role title and role description.
    - **Current Competencies**: List of acquired skills and self-assessed proficiency ratings (1-5).
    - **Target Skill Gaps**: Missing skills, partial gaps, and prerequisite blocking states computed via `skillGapService.js`.
    - **Granular Learning Progress**: Completed sub-topic count from `UserTopicProgress`.
    - **Active Course Enrollments**: Enrolled learning resources and completion percentages from `LearningProgress`.
    - **Matched Job Opportunities**: Top matching job openings and compatibility percentages from `jobService.js`.
  - Assembles a structured system prompt instructing the model to act as a pragmatic technical career coach.
- **Google Gemini API Integration**:
  - Communicates with Google's Generative AI endpoint:
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={GEMINI_API_KEY}`
  - Executed via native Node.js `https.request`.
- **Intelligent Fallback Architecture**:
  - If `GEMINI_API_KEY` is not configured, or if the external Gemini API is unreachable/rate-limited, `aiService.js` executes a rule-based contextual fallback generator.
  - The fallback engine inspects the user's specific skill gaps and produces a structured, actionable markdown response detailing top priority skills to learn next.
- **Proactive Skill Gap Advice (`GET /api/ai/gap-advice`)**:
  - Dedicated endpoint generating targeted advice on closing skill gaps for the user's active career goal without requiring manual user prompting.
- **Slide-Over Chat Interface (`AIAssistant.jsx`)**:
  - Floating trigger button and responsive slide-out drawer accessible across all dashboard pages.
  - Contextual quick-prompt chips (e.g., "What should I learn next?", "How do I close my React gap?", "Review my role readiness").
  - Formats responses using Markdown, code snippets, and structured bullet points.

---

## 4. Frontend Files Involved
- `Frontend/src/components/AIAssistant.jsx`: Primary chat drawer component handling user inputs, suggestion chips, message lists, and markdown rendering.
- `Frontend/src/layouts/DashboardLayout.jsx`: Houses the global floating AI action button and mounts the slide-over drawer across all authenticated pages.
- `Frontend/src/services/api.js`: Exports `aiApi` (`chat`, `getGapAdvice`).

---

## 5. Backend Files Involved
- `Backend/src/routes/aiRoutes.js`: REST routes for AI chat and gap advice.
- `Backend/src/controllers/aiController.js`: Dispatches incoming chat payloads and handles responses.
- `Backend/src/services/aiService.js`: Queries user context, formats Gemini prompt, handles HTTPS communication, and provides fallback generation.
- `Backend/src/services/skillGapService.js`: Invoked to retrieve real-time skill gaps.
- `Backend/src/services/jobService.js`: Invoked to retrieve top matching jobs.
- `Backend/src/models/User.js`: Retrieves student identity and academic background.
- `Backend/src/models/UserSkill.js`: Retrieves student skill proficiencies.
- `Backend/src/models/Role.js`: Retrieves target role information.
- `Backend/src/models/LearningProgress.js`: Retrieves enrolled course status.
- `Backend/src/models/UserTopicProgress.js`: Retrieves completed sub-topic checklist items.
- `Backend/src/config/config.js`: Validates `GEMINI_API_KEY`.

---

## 6. APIs Involved
- `POST /api/ai/chat`: Submits user query and conversation history, returning AI-generated career mentorship advice.
  - Body: `{ message: string, history?: [{ role: 'user' | 'model', text: string }] }`
  - Response: `{ success: true, data: { reply: string, isFallback: boolean } }`
- `GET /api/ai/gap-advice`: Returns proactive, non-conversational AI recommendations for closing active target role gaps.
  - Response: `{ success: true, data: { advice: string } }`

---

## 7. Database Models Involved
- `User` (`Backend/src/models/User.js`): Ingests name, college, branch, year of study, target role.
- `UserSkill` (`Backend/src/models/UserSkill.js`): Ingests current competency profile.
- `Role` & `RoleSkill` (`Backend/src/models/Role.js`, `RoleSkill.js`): Ingests target benchmarks.
- `LearningProgress` (`Backend/src/models/LearningProgress.js`): Ingests active course progress.
- `UserTopicProgress` (`Backend/src/models/UserTopicProgress.js`): Ingests topic milestone counts.
- `Job` (`Backend/src/models/Job.js`): Ingests employment opportunities.

---

## 8. Authentication / Authorization
- Both `/api/ai/chat` and `/api/ai/gap-advice` require `authMiddleware.authenticate`.
- Context queries are strictly tied to `req.user._id`, ensuring users cannot access or leak another learner's profile or progress into the AI prompt.

---

## 9. Dependencies
- Native Node.js `https`: Issues outbound HTTPS REST requests to the Google Gemini API endpoint.
- `react` (^18.2.0): Chat interface state, message history, and drawer transitions.
- `lucide-react` (^0.378.0): Bot, user, send, close, and spark icons.

---

## 10. Current Workflow
1. **Drawer Opening**:
   - User clicks the floating "AI Coach" button in `DashboardLayout.jsx`.
   - `AIAssistant.jsx` slides into view.
2. **Submitting Query**:
   - User types a query or selects a suggestion chip (e.g., "What should I learn next?").
   - Frontend calls `POST /api/ai/chat` with `{ message, history }`.
3. **Prompt Grounding**:
   - `aiService.js` resolves the user's `User` record, `UserSkill` inventory, `targetRoleId`, invokes `skillGapService.getSkillGap()` and `jobService.getMatchingJobs()`, and counts completed topics.
   - Combines these facts into a structured system prompt grounding the LLM in the student's actual current state.
4. **Model Execution**:
   - `aiService.js` makes an HTTPS POST request to Google Gemini API (`gemini-3.6-flash`).
   - If the request succeeds, returns the generated markdown response.
   - If the request fails or key is missing, triggers contextual heuristic fallback.
5. **Rendering Response**:
   - Frontend appends the reply to the message history state and renders formatted markdown text.

---

## 11. Current Limitations
- **Raw HTTPS vs Official SDK**: Uses native Node.js `https.request` rather than the official `@google/genai` or `@google/generative-ai` SDKs, lacking built-in retry backoffs, automated token budgeting, and type definitions.
- **Streaming Not Implemented**: Responses are delivered as a single blocking JSON payload; Server-Sent Events (SSE) or WebSocket token streaming for real-time word-by-word typing is Not currently implemented.
- **Persistent Conversation Storage**: Chat history is stored solely in React component state (`messages` array); conversation persistence in MongoDB (e.g., `Conversation` or `ChatMessage` models) across sessions or devices is Not currently implemented.
- **External Tool / Function Calling**: Model cannot directly invoke SkillGraph APIs (e.g. "enroll me in that course" or "mark topic completed"); it can only provide textual guidance.
- **Multi-Modal Input**: Attaching code files, resumes (PDF), or project screenshots is Not currently implemented.

---

## 12. Existing Validation
- **Message Content**: `message` must be a non-empty string.
- **History Format**: `history` (if provided) must be an array of valid message turn objects.
- **Auth Guard**: Rejects unauthenticated requests with HTTP 401.

---

## 13. Existing Error Handling
- **Missing API Key**: If `GEMINI_API_KEY` is undefined, `aiService.js` seamlessly engages the fallback generator, returning a rich contextual reply with `isFallback: true` rather than crashing the server.
- **Upstream Gemini API Failures**: Catches HTTP 4xx/5xx or timeout errors from the Gemini endpoint, logs the incident, and gracefully switches to fallback advice.
- **Client Error Handling**: `AIAssistant.jsx` catches network failures and renders an inline alert allowing the user to retry.

---

## 14. Important Relationships with Other Modules
- **Cross-Cutting Synthesizer**: Ingests state from **Student**, **Skills**, **Career**, **SkillGap**, **Learning**, and **JobMatching** modules to synthesize unified advice.
- **UI Shell**: Embedded globally within `DashboardLayout.jsx`, making coaching accessible across all platform pages.
