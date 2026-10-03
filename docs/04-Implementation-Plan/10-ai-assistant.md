# SkillGraph Implementation Plan: Module 10 — AI Assistant & Streaming

## 1. Module
**10 — AI Career Assistant, Official GenAI SDK & Real-Time Token Streaming**

---

## 2. Current State
- **CURRENTLY IMPLEMENTED**:
  - Context grounding prompt synthesis combining student profile, skills, target role gaps, active courses, and job matches.
  - Communication with Google Gemini (`gemini-3.6-flash`) using native Node.js `https.request`.
  - Single blocking JSON response `{ reply }` causing a 3–8 second latency wait.
  - Heuristic fallback generator when `GEMINI_API_KEY` is missing or requests fail.
  - Non-persistent chat history stored in React component state (`messages` array).
  - Slide-over chat drawer in `Frontend/src/components/AIAssistant.jsx`.
- **TO BE IMPLEMENTED**:
  - Migration to the official `@google/genai` SDK.
  - Real-time token streaming using Server-Sent Events (SSE) via `POST /api/ai/chat/stream`.
  - Persistent conversation storage in MongoDB using the `ChatMessage` collection.
  - History hydration on drawer open (`GET /api/ai/history`) and history reset (`DELETE /api/ai/history`).
  - Word-by-word typewriter UI rendering in `AIAssistant.jsx`.

---

## 3. Objective
Upgrade the AI Career Assistant into a modern, production-grade conversational experience by implementing real-time token streaming and persistent database history using Google's official Generative AI SDK.

---

## 4. Existing Files
- `Backend/src/routes/aiRoutes.js`: AI routes.
- `Backend/src/controllers/aiController.js`: AI controller.
- `Backend/src/services/aiService.js`: Prompt synthesis and Gemini communication.
- `Frontend/src/components/AIAssistant.jsx`: Chat drawer component.
- `Frontend/src/services/api.js`: AI API client.

---

## 5. Files To Modify
- **CURRENTLY IMPLEMENTED**: Unmodified baseline.
- **TO BE IMPLEMENTED**:
  - `Backend/src/routes/aiRoutes.js`: Add `POST /chat/stream`, `GET /history`, `DELETE /history`.
  - `Backend/src/controllers/aiController.js`: Add streaming handler and history controllers.
  - `Backend/src/services/aiService.js`:
    - Refactor Gemini calls to use `@google/genai` or streaming `https.request`.
    - Implement `streamChatResponse(userId, message, res)` handling SSE protocol.
    - Persist user prompt and assistant response into `ChatMessage` collection.
    - Implement `getChatHistory(userId)` and `clearChatHistory(userId)`.
  - `Frontend/src/components/AIAssistant.jsx`:
    - Refactor send handler to use `fetch` with `ReadableStream` reader.
    - Load message history on mount via `api.get('/ai/history')`.
    - Add "Clear History" action button.

---

## 6. Database Changes
- **CURRENTLY IMPLEMENTED**: None.
- **TO BE IMPLEMENTED**:
  - `ChatMessage` model (created in Module 02):
    - `userId`: ObjectId, ref: `'User'`, required, indexed.
    - `role`: `'user'` | `'assistant'`, required.
    - `content`: String, required.
    - `isFallback`: Boolean, default: false.
    - `createdAt`: Date, default: `Date.now`, indexed.

---

## 7. Backend Changes
- **CURRENTLY IMPLEMENTED**: Buffers full HTTP response before returning.
- **TO BE IMPLEMENTED**:
  - In `aiService.js`:
    - Initialize Google Gen AI client with `config.geminiApiKey`.
    - In `streamChatResponse(userId, message, res)`:
      - Set SSE headers:
        ```javascript
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        ```
      - Save user message to `ChatMessage.create({ userId, role: 'user', content: message })`.
      - Assemble grounded context prompt from live user data.
      - Call streaming API `model.generateContentStream(prompt)` (or chunked HTTPS streaming).
      - For each chunk, send: `res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);`.
      - On completion, save full assistant response to `ChatMessage` collection and write: `res.write('data: [DONE]\n\n'); res.end();`.
      - If API key is missing or fails, stream fallback text chunks cleanly with a simulated typing delay.

---

## 8. API Changes
- **CURRENTLY IMPLEMENTED**: `POST /api/ai/chat`, `GET /api/ai/gap-advice`.
- **TO BE IMPLEMENTED**:
  - `POST /api/ai/chat/stream`: Initiates SSE stream. Body: `{ message: string }`. Emits SSE events.
  - `GET /api/ai/history`: Returns user's persisted chat history (`[{ role, content, createdAt }]`).
  - `DELETE /api/ai/history`: Clears user's chat history.

---

## 9. Frontend Changes
- **CURRENTLY IMPLEMENTED**: Blocking spinner until complete message arrives.
- **TO BE IMPLEMENTED**:
  - In `Frontend/src/components/AIAssistant.jsx`:
    - When user sends message, append user message to state, then create an empty assistant message entry.
    - Initiate streaming fetch request to `/api/ai/chat/stream` with Authorization header.
    - Read response body chunks via `response.body.getReader()`.
    - Decode text chunks and append to the active assistant message in real time, giving word-by-word typing effect.
    - Auto-scroll chat viewport smoothly as text streams in.
    - Add "Clear Chat" button in drawer header.

---

## 10. Authentication / RBAC
- **CURRENTLY IMPLEMENTED**: Authenticated users only.
- **TO BE IMPLEMENTED**:
  - Maintained: all AI endpoints require valid Bearer token. Streaming endpoint validates token passed in header.

---

## 11. Validation
- **CURRENTLY IMPLEMENTED**: Message non-empty check.
- **TO BE IMPLEMENTED**:
  - Enforce maximum prompt length (e.g. 1000 characters) to prevent token abuse.

---

## 12. Error Handling
- **CURRENTLY IMPLEMENTED**: Heuristic fallback on error.
- **TO BE IMPLEMENTED**:
  - If stream fails mid-generation, emit `data: {"error": "Stream interrupted"}\n\n` so frontend gracefully preserves whatever tokens arrived rather than crashing.

---

## 13. Testing Plan
- **CURRENTLY IMPLEMENTED**: None.
- **TO BE IMPLEMENTED**:
  - Integration tests in `Backend/tests/aiAssistant.test.js`:
    - Test 1: Calling `/api/ai/history` retrieves persisted messages in chronological order.
    - Test 2: Calling `DELETE /api/ai/history` deletes user's messages without affecting other users.
    - Test 3: Fallback generation triggers cleanly and formats valid markdown advice when API key is unset.

---

## 14. Dependencies
- **CURRENTLY IMPLEMENTED**: Native `https`.
- **TO BE IMPLEMENTED**: `@google/genai` (installed in Module 01).

---

## 15. Implementation Order
1. Implement `ChatMessage.js` persistence methods in `aiService.js`.
2. Implement streaming response generator in `aiService.js`.
3. Add routes in `aiRoutes.js` and controller methods in `aiController.js`.
4. Refactor `AIAssistant.jsx` with ReadableStream reader and history loading.
5. Run `aiAssistant.test.js`.

---

## 16. Acceptance Criteria
- **AC-01**: User typing a query sees the AI's response start appearing within 500ms, streaming word-by-word.
- **AC-02**: Refreshing the browser or navigating across pages preserves past conversation history.
- **AC-03**: The assistant continues to incorporate live skill gap and course data into its advice.
- **AC-04**: If the Gemini API key is unset, fallback advice streams smoothly without breaking the UI.

---

## 17. Risks
- **Risk 1 (SSE Proxy Buffering)**: Reverse proxies (Nginx/Vercel) may buffer SSE chunks instead of delivering them immediately.
  - *Mitigation*: Set `X-Accel-Buffering: no` header in the SSE response to instruct proxies to stream immediately.

---

## 18. Rollback Considerations
- Retain the non-streaming `POST /api/ai/chat` endpoint as an active fallback if a client browser lacks `ReadableStream` support.
