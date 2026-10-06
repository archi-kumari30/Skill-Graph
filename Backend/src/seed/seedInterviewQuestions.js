const mongoose = require('mongoose');
const InterviewQuestion = require('../models/InterviewQuestion');

const interviewSeedData = [
  // --- FRONTEND: HTML ---
  {
    domain: 'Frontend',
    technology: 'HTML',
    topic: 'Semantic HTML & Accessibility',
    difficulty: 'Beginner',
    order: 1,
    question: 'Why is Semantic HTML important, and what are its benefits for accessibility and SEO?',
    answer: 'Semantic HTML introduces meaning to web page structure rather than just presentation (e.g. using `<main>`, `<article>`, `<section>`, `<nav>`, `<header>` instead of arbitrary `<div>` tags). \n\nKey benefits include:\n1. **Accessibility (a11y):** Screen readers use semantic landmarks to navigate sections effortlessly, enabling visually impaired users to jump directly to primary content or skip navigation links.\n2. **Search Engine Optimization (SEO):** Web crawlers (like Googlebot) prioritize headings (`<h1>`-`<h6>`), article summaries, and structured microdata to index content hierarchy accurately.\n3. **Maintainability & Developer Experience:** Clean, self-describing code is significantly easier to review, debug, and refactor across team members.',
    codeSnippet: '<!-- Non-semantic approach (Avoid) -->\n<div class="header">\n  <div class="nav-links">...</div>\n</div>\n\n<!-- Semantic approach (Recommended) -->\n<header role="banner">\n  <nav aria-label="Main Navigation">\n    <ul>\n      <li><a href="/dashboard">Dashboard</a></li>\n    </ul>\n  </nav>\n</header>\n<main id="main-content">\n  <article>\n    <h1>Semantic Architecture in Modern Web</h1>\n    <p>Body content...</p>\n  </article>\n</main>',
    keyPoints: [
      'Semantic tags convey meaning and content hierarchy to user agents.',
      'Improves WCAG compliance and screen-reader accessibility landmarks.',
      'Enhances search engine indexation by clarifying content structure.'
    ],
    companyTags: ['Amazon', 'Microsoft', 'Shopify']
  },
  {
    domain: 'Frontend',
    technology: 'HTML',
    topic: 'Performance & Resource Loading',
    difficulty: 'Intermediate',
    order: 2,
    question: 'Explain the difference between `<script>`, `<script async>`, and `<script defer>`.',
    answer: 'Understanding how the browser’s HTML parser processes external JavaScript tags is crucial for web performance:\n\n1. **Regular `<script>`:** The HTML parser pauses synchronously when it encounters the script tag, downloads the script file over the network, executes it immediately, and only then resumes HTML parsing. This causes rendering blockages.\n2. **`<script async>`:** The browser downloads the script in the background asynchronously while HTML parsing continues. However, **as soon as the script finishes downloading, HTML parsing is paused immediately** while the script executes. Execution order is non-deterministic (scripts run in whatever order they finish downloading).\n3. **`<script defer>`:** The browser downloads the script asynchronously in parallel with HTML parsing. The script **only executes after the entire HTML document is fully parsed**, right before the `DOMContentLoaded` event fires. Furthermore, deferred scripts guarantee execution order matching their sequence in the DOM.',
    codeSnippet: '<!-- Blocks HTML parsing during download AND execution -->\n<script src="analytics.js"></script>\n\n<!-- Downloads in parallel; executes immediately when ready (Order NOT guaranteed) -->\n<script async src="tracker.js"></script>\n\n<!-- Downloads in parallel; executes in sequence AFTER parsing finishes (Best for app code) -->\n<script defer src="app.js"></script>',
    keyPoints: [
      'Default scripts block HTML parsing for both download and execution.',
      '`async` runs immediately after download finishes, regardless of parser state.',
      '`defer` preserves script ordering and executes only after complete document parsing.'
    ],
    companyTags: ['Google', 'Meta', 'Netflix']
  },

  // --- FRONTEND: CSS ---
  {
    domain: 'Frontend',
    technology: 'CSS',
    topic: 'Box Model & Layout',
    difficulty: 'Beginner',
    order: 3,
    question: 'Explain the CSS Box Model and the practical impact of `box-sizing: border-box`.',
    answer: 'The CSS Box Model consists of four concentric layers wrapping every rendered element: **Content**, **Padding**, **Border**, and **Margin**.\n\n- By default (`box-sizing: content-box`), when you specify `width: 200px` and add `padding: 20px` and `border: 2px solid black`, the element’s actual rendered width on screen becomes `200 + 40 + 4 = 244px`.\n- With `box-sizing: border-box`, the specified `width` encompasses Content + Padding + Border. Setting `width: 200px` ensures the outer boundary remains exactly 200px, with padding and border shrinking the internal content area accordingly. This eliminates unwanted layout shifts and wrapping bugs in responsive grids.',
    codeSnippet: '/* Recommended global reset for responsive predictable layouts */\n*,\n*::before,\n*::after {\n  box-sizing: border-box;\n  margin: 0;\n  padding: 0;\n}',
    keyPoints: [
      'Box Model components: Content -> Padding -> Border -> Margin.',
      '`content-box` adds padding and borders outside the defined dimension.',
      '`border-box` includes padding and border within width/height, ensuring predictable layout.'
    ],
    companyTags: ['Adobe', 'Uber', 'Atlassian']
  },
  {
    domain: 'Frontend',
    technology: 'CSS',
    topic: 'Modern Layout Engines',
    difficulty: 'Intermediate',
    order: 4,
    question: 'When should you choose CSS Flexbox over CSS Grid, and vice versa?',
    answer: 'The core distinction between CSS Flexbox and CSS Grid lies in dimensionality and directional intent:\n\n1. **Flexbox (One-Dimensional):** Designed for distributing space and aligning items along a **single axis** at a time (either horizontally as a row OR vertically as a column). Ideal for navigational bars, action button clusters, tab headers, and centering cards.\n2. **CSS Grid (Two-Dimensional):** Designed for laying out items simultaneously across **both rows and columns**. Grid is ideal for overall page architectures, dashboard metric layouts, gallery photo matrices, and complex multi-column responsive arrangements where rows and columns must strictly align.',
    codeSnippet: '/* 1D Alignment with Flexbox */\n.nav-container {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n\n/* 2D System with CSS Grid */\n.dashboard-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));\n  gap: 1.5rem;\n}',
    keyPoints: [
      'Flexbox operates along 1 dimension (row or column).',
      'Grid manages 2 dimensions simultaneously (rows and columns).',
      'Use Flexbox for component-level flow and Grid for full-page layout structures.'
    ],
    companyTags: ['Stripe', 'Twitter', 'Airbnb']
  },

  // --- FRONTEND: JAVASCRIPT ---
  {
    domain: 'Frontend',
    technology: 'JavaScript',
    topic: 'Closures & Lexical Scope',
    difficulty: 'Intermediate',
    order: 5,
    question: 'What is a closure in JavaScript, and what are real-world use cases for closures?',
    answer: 'A **closure** is the combination of a function bundled together with references to its surrounding lexical environment. In JavaScript, an inner function retains access to variables declared in its outer enclosing function even after the outer function has finished executing and returned.\n\nReal-world applications include:\n1. **Data privacy & encapsulation:** Creating private variables that cannot be modified directly from outside code (e.g. module pattern or factory functions).\n2. **Function currying and partial application:** Pre-configuring functions with specific configuration arguments.\n3. **Event handlers & memoization:** Retaining state or cache across repeated calls without polluting global scope.',
    codeSnippet: 'function createRateLimiter(maxCalls) {\n  let callCount = 0; // Private variable enclosed in lexical scope\n  \n  return function (action) {\n    if (callCount >= maxCalls) {\n      return { allowed: false, message: "Rate limit reached" };\n    }\n    callCount++;\n    return { allowed: true, remaining: maxCalls - callCount, result: action() };\n  };\n}\n\nconst limitThree = createRateLimiter(3);\nconsole.log(limitThree(() => "Request 1").allowed); // true\nconsole.log(limitThree(() => "Request 2").allowed); // true\nconsole.log(limitThree(() => "Request 3").allowed); // true\nconsole.log(limitThree(() => "Request 4").allowed); // false',
    keyPoints: [
      'Closures give inner functions access to outer function variables after outer scope returns.',
      'Enables true encapsulation and data privacy in vanilla JS.',
      'Common in debouncing, throttling, currying, and memoization.'
    ],
    companyTags: ['Google', 'Meta', 'Amazon', 'Apple']
  },
  {
    domain: 'Frontend',
    technology: 'JavaScript',
    topic: 'Event Loop & Asynchrony',
    difficulty: 'Advanced',
    order: 6,
    question: 'How does the JavaScript Event Loop handle microtasks vs macrotasks?',
    answer: 'JavaScript is single-threaded, running code on a single Call Stack. To handle asynchronous non-blocking I/O, the browser/runtime employs the **Event Loop** alongside task queues:\n\n1. **Call Stack:** Executes synchronous functions in Last-In-First-Out order.\n2. **Microtask Queue:** Highest priority asynchronous queue. Includes `Promise` callbacks (`.then()`, `.catch()`, `.finally()`), `queueMicrotask()`, and `MutationObserver`.\n3. **Macrotask (Task) Queue:** Lower priority queue. Includes `setTimeout`, `setInterval`, `setImmediate` (Node), and I/O callbacks.\n\n**Execution Order Rule:**\nWhen the Call Stack becomes completely empty, the Event Loop checks the **Microtask Queue** and executes **ALL** pending microtasks until the queue is completely drained. Only once the microtask queue is entirely clear does the Event Loop take **one single macrotask** from the Macrotask Queue, push it onto the call stack, run it, and then check microtasks again.',
    codeSnippet: 'console.log("1 - Sync");\n\nsetTimeout(() => {\n  console.log("2 - Macrotask (setTimeout)");\n}, 0);\n\nPromise.resolve().then(() => {\n  console.log("3 - Microtask 1 (Promise)");\n}).then(() => {\n  console.log("4 - Microtask 2 (Promise chaining)");\n});\n\nconsole.log("5 - Sync end");\n\n// Output:\n// 1 - Sync\n// 5 - Sync end\n// 3 - Microtask 1 (Promise)\n// 4 - Microtask 2 (Promise chaining)\n// 2 - Macrotask (setTimeout)',
    keyPoints: [
      'Microtasks (Promises) always run before the next macrotask (setTimeout).',
      'The microtask queue must be completely drained before yielding to the next macrotask or browser paint.',
      'Avoid infinite microtask loops as they starve user interactions and UI re-renders.'
    ],
    companyTags: ['Google', 'Netflix', 'Uber', 'LinkedIn']
  },

  // --- FRONTEND: REACT ---
  {
    domain: 'Frontend',
    technology: 'React',
    topic: 'Hooks Lifecycle & Rules',
    difficulty: 'Intermediate',
    order: 7,
    question: 'Explain how `useEffect` works, why the dependency array is essential, and when cleanup occurs.',
    answer: '`useEffect` allows React functional components to perform side effects (data fetching, DOM mutations, subscriptions, timers) after render:\n\n- **No dependency array (`useEffect(fn)`):** Runs after **every single render**. Almost always an anti-pattern for network requests.\n- **Empty dependency array (`useEffect(fn, [])`):** Runs **only once** after the initial mount, similar to `componentDidMount`.\n- **With dependencies (`useEffect(fn, [a, b])`):** Runs on mount and whenever reference checks on `a` or `b` indicate a change (`Object.is(prev, next)`).\n\n**Cleanup Function:**\nReturning a function inside `useEffect` designates cleanup logic. React calls this cleanup function:\n1. Before re-running the effect on subsequent renders when dependencies change.\n2. When the component unmounts from the DOM.\nThis prevents memory leaks, dangling web socket connections, and stale timers.',
    codeSnippet: 'useEffect(() => {\n  let isMounted = true;\n  const controller = new AbortController();\n\n  async function fetchCandidateData() {\n    try {\n      const res = await api.get(`/candidates/${id}`, { signal: controller.signal });\n      if (isMounted) setData(res.data);\n    } catch (err) {\n      if (!controller.signal.aborted) setError(err.message);\n    }\n  }\n\n  fetchCandidateData();\n\n  return () => {\n    isMounted = false;\n    controller.abort(); // Cancel in-flight network request on unmount/re-render\n  };\n}, [id]);',
    keyPoints: [
      'Dependencies guide React on when to re-execute effect functions.',
      'Cleanup callbacks execute before subsequent effect runs and upon component unmount.',
      'Always clean up timers, subscriptions, and cancelable network requests.'
    ],
    companyTags: ['Meta', 'Amazon', 'Airbnb', 'DoorDash']
  },
  {
    domain: 'Frontend',
    technology: 'React',
    topic: 'Performance Optimization',
    difficulty: 'Advanced',
    order: 8,
    question: 'How do `React.memo`, `useMemo`, and `useCallback` prevent unnecessary re-renders?',
    answer: 'By default in React, when a parent component re-renders, **all child components re-render recursively**, regardless of whether their props changed.\n\n1. **`React.memo(Component)`:** A higher-order component that wraps a component and performs a shallow equality check on incoming `props`. If props have not changed, React skips re-rendering the wrapped component and reuses the previous rendered output.\n2. **`useCallback(fn, deps)`:** Memoizes a **function instance**. In JavaScript, functions are compared by reference (`() => {} !== () => {}`). Without `useCallback`, every render generates a new function instance, causing child components wrapped in `React.memo` to break memoization and re-render needlessly.\n3. **`useMemo(() => compute(), deps)`:** Memoizes the **result value** of an expensive computation so it is only re-calculated when designated dependencies change.',
    codeSnippet: 'const StudentCard = React.memo(({ student, onSelect }) => {\n  return (\n    <div onClick={() => onSelect(student.id)}>\n      <h3>{student.name}</h3>\n    </div>\n  );\n});\n\nconst StudentDirectory = ({ students }) => {\n  // Stable function reference across renders\n  const handleSelect = useCallback((studentId) => {\n    console.log("Selected:", studentId);\n  }, []);\n\n  // Cache expensive filter/sort calculation\n  const topPerformers = useMemo(() => {\n    return students.filter(s => s.readinessScore >= 80);\n  }, [students]);\n\n  return (\n    <div>\n      {topPerformers.map(s => (\n        <StudentCard key={s.id} student={s} onSelect={handleSelect} />\n      ))}\n    </div>\n  );\n};',
    keyPoints: [
      '`React.memo` skips rendering if props remain shallowly identical.',
      '`useCallback` stabilizes function references passed as props to memoized children.',
      '`useMemo` caches the return values of expensive calculations.'
    ],
    companyTags: ['Meta', 'Uber', 'Salesforce', 'Netflix']
  },

  // --- BACKEND: NODE.JS & EXPRESS ---
  {
    domain: 'Backend',
    technology: 'Node.js',
    topic: 'Architecture & Event Loop',
    difficulty: 'Intermediate',
    order: 9,
    question: 'Explain the Libuv Event Loop phases in Node.js and why Node.js is well-suited for I/O intensive apps.',
    answer: 'Node.js pairs the V8 JavaScript engine with **Libuv**, a multi-platform C library that provides an event-driven asynchronous I/O thread pool.\n\nThe Node.js Event Loop operates in distinct phases:\n1. **Timers Phase:** Executes callbacks scheduled by `setTimeout()` and `setInterval()`.\n2. **Pending Callbacks (I/O) Phase:** Executes I/O callbacks deferred from the previous loop iteration (e.g. system errors like TCP ECONNREFUSED).\n3. **Idle, Prepare Phase:** Used internally by Libuv.\n4. **Poll Phase:** Retrieves new I/O events, executes I/O related callbacks, blocks and waits for connections if poll queue is empty.\n5. **Check Phase:** Executes callbacks registered with `setImmediate()`.\n6. **Close Callbacks Phase:** Handles socket or stream close events (`socket.on("close", ...)`).\n\nBetween every phase, Node executes **`process.nextTick()`** and **Microtask Queue** items before advancing.',
    codeSnippet: '// Demonstration of phase sequence in Node\nsetTimeout(() => console.log("Timer callback (Timers phase)"), 0);\nsetImmediate(() => console.log("Immediate callback (Check phase)"));\nprocess.nextTick(() => console.log("nextTick callback (Runs before phase transition)"));\nPromise.resolve().then(() => console.log("Promise microtask"));\n\n// Output:\n// nextTick callback\n// Promise microtask\n// Timer callback\n// Immediate callback',
    keyPoints: [
      'Libuv manages thread pool (default 4 threads) for heavy disk/crypto operations.',
      '`process.nextTick()` executes immediately after current operation completes, before event loop phases advance.',
      'Node excels at high-concurrency non-blocking network I/O.'
    ],
    companyTags: ['Netflix', 'PayPal', 'LinkedIn', 'Uber']
  },
  {
    domain: 'Backend',
    technology: 'Express.js',
    topic: 'Middleware Architecture',
    difficulty: 'Intermediate',
    order: 10,
    question: 'How does the Express middleware chain execute, and how should centralized error handling be structured?',
    answer: 'Express is fundamentally a routing and middleware web framework. Middleware functions have access to the Request object (`req`), Response object (`res`), and the `next` function in the application’s request-response cycle.\n\nKey rules of the pipeline:\n1. **Sequential execution:** Middleware runs in the exact order it is mounted using `app.use()`.\n2. **Delegation via `next()`:** If a middleware does not terminate the cycle by sending a response (`res.json()`, `res.send()`), it MUST invoke `next()` to pass execution to the subsequent handler; otherwise the request hangs.\n3. **Error Handling Middleware:** Defined with **four arguments** `(err, req, res, next)`. When `next(err)` is invoked with any argument, Express immediately bypasses all regular route handlers and jumps directly to the first error-handling middleware.',
    codeSnippet: '// Centralized Custom Error Handling Middleware\nconst errorHandler = (err, req, res, next) => {\n  const statusCode = err.statusCode || 500;\n  const message = err.isOperational ? err.message : "Internal Server Error";\n\n  // Log unexpected exceptions for observability\n  if (statusCode === 500) {\n    console.error("[CRITICAL]", err.stack);\n  }\n\n  res.status(statusCode).json({\n    success: false,\n    error: {\n      message,\n      status: statusCode,\n      timestamp: new Date().toISOString()\n    }\n  });\n};\n\napp.use(errorHandler);',
    keyPoints: [
      'Middleware executes in definition order; must call `next()` or send a response.',
      'Error handlers require 4 parameters: `(err, req, res, next)`.',
      'Distinguish operational errors (400, 401, 404) from programming bugs (500).'
    ],
    companyTags: ['Stripe', 'Twilio', 'Coinbase']
  },

  // --- DATABASE: MONGODB & SQL ---
  {
    domain: 'Database',
    technology: 'MongoDB',
    topic: 'Indexing & Performance Tuning',
    difficulty: 'Intermediate',
    order: 11,
    question: 'What types of indexes does MongoDB support, and how does the Equality-Sort-Range (ESR) rule guide compound index design?',
    answer: 'Without indexes, MongoDB must perform a collection scan (`COLLSCAN`), inspecting every single document in a collection. Compound indexes enable targeted lookups and sorting in index memory (`IXSCAN`).\n\n**The ESR Rule (Equality, Sort, Range):**\nWhen designing compound indexes for queries combining multiple clauses, arrange index fields in this exact order:\n1. **Equality (E):** Put fields evaluated for exact matching (`status: "active"`, `department: "Engineering"`) first. This narrows down index search keys to the smallest matching bucket.\n2. **Sort (S):** Place fields used in `sort()` next (`createdAt: -1`). If sort keys follow equality keys directly, MongoDB can traverse the B-tree index in order without doing an expensive in-memory sort (`SORT_KEY_GENERATOR`).\n3. **Range (R):** Place fields with range operators (`$gt`, `$lt`, `$in`) last. Any field placed after a range field cannot be used efficiently for sorting.',
    codeSnippet: '// Query:\n// db.jobs.find({ status: "Active", experienceLevel: "Mid" }).sort({ createdAt: -1 })\n\n// Compound Index adhering to ESR rule:\n// Equality: { status: 1, experienceLevel: 1 }, Sort: { createdAt: -1 }\n\njobSchema.index({ status: 1, experienceLevel: 1, createdAt: -1 });',
    keyPoints: [
      'Indexes prevent slow collection scans (`COLLSCAN`) by searching B-trees (`IXSCAN`).',
      'ESR rule order: Equality fields first -> Sort fields second -> Range fields last.',
      'Use `.explain("executionStats")` to verify index coverage and totalDocsExamined vs nReturned.'
    ],
    companyTags: ['MongoDB Inc', 'Coinbase', 'Lyft', 'Adobe']
  },
  {
    domain: 'Database',
    technology: 'SQL',
    topic: 'Relational Queries & Joins',
    difficulty: 'Intermediate',
    order: 12,
    question: 'Explain the differences between INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL OUTER JOIN with practical examples.',
    answer: 'SQL Joins combine rows from two or more tables based on a related column between them:\n\n1. **INNER JOIN:** Returns only rows where there is a match in **both** tables. Non-matching rows from either table are excluded.\n2. **LEFT JOIN (LEFT OUTER JOIN):** Returns all rows from the left table, and matched rows from the right table. If no match exists, the right table columns return `NULL`.\n3. **RIGHT JOIN (RIGHT OUTER JOIN):** Returns all rows from the right table, and matched rows from the left table. If no match exists, left table columns return `NULL`.\n4. **FULL OUTER JOIN:** Returns all records when there is a match in either left or right table. Unmatched records on either side are filled with `NULL`.',
    codeSnippet: '-- Find all candidates and any jobs they have applied for,\n-- including candidates who have NOT submitted applications yet:\nSELECT \n  users.name AS candidate_name,\n  users.email,\n  jobs.title AS applied_position,\n  job_applications.status\nFROM users\nLEFT JOIN job_applications ON users.id = job_applications.user_id\nLEFT JOIN jobs ON job_applications.job_id = jobs.id\nWHERE users.account_role = \'student\';',
    keyPoints: [
      'INNER JOIN returns strictly intersection rows.',
      'LEFT JOIN preserves all left rows and fills missing right attributes with NULL.',
      'Use LEFT JOIN when finding items that may have 0 child relations (e.g. students with no applications).'
    ],
    companyTags: ['Amazon', 'Oracle', 'Goldman Sachs', 'Meta']
  },
  {
    domain: 'Database',
    technology: 'SQL',
    topic: 'Transactions & ACID Properties',
    difficulty: 'Advanced',
    order: 13,
    question: 'What are the ACID properties in database management systems, and why are they critical?',
    answer: 'ACID guarantees that database transactions are processed reliably:\n\n1. **Atomicity:** All operations within a transaction either execute completely or all are rolled back. No partial state is ever committed (All-or-Nothing).\n2. **Consistency:** Any transaction will bring the database from one valid state to another, maintaining all schema constraints, cascades, foreign keys, and unique indexes.\n3. **Isolation:** Concurrent transactions execute without interfering with one another. Isolation levels (Read Uncommitted, Read Committed, Repeatable Read, Serializable) protect against dirty reads, non-repeatable reads, and phantom reads.\n4. **Durability:** Once a transaction is committed, its changes are written to non-volatile storage (WAL / redo log) and will survive any subsequent system crash or power outage.',
    codeSnippet: 'BEGIN TRANSACTION;\n\n-- Deduct funds\nUPDATE accounts SET balance = balance - 500 WHERE id = 101;\n\n-- Credit beneficiary\nUPDATE accounts SET balance = balance + 500 WHERE id = 202;\n\n-- Record ledger audit\nINSERT INTO transaction_logs (sender, recipient, amount) VALUES (101, 202, 500);\n\n-- If any statement fails, ROLLBACK; otherwise:\nCOMMIT;',
    keyPoints: [
      'Atomicity ensures all-or-nothing execution.',
      'Consistency enforces business and database invariants.',
      'Isolation prevents dirty and phantom reads across concurrent requests.',
      'Durability persists committed changes across crashes via write-ahead logging.'
    ],
    companyTags: ['Stripe', 'Visa', 'Bloomberg', 'JPMorgan']
  },

  // --- BACKEND: REST APIS ---
  {
    domain: 'Backend',
    technology: 'REST APIs',
    topic: 'HTTP Methods & Idempotency',
    difficulty: 'Intermediate',
    order: 14,
    question: 'What constitutes a truly RESTful API, and what is the difference between PUT and PATCH?',
    answer: 'Representational State Transfer (REST) is an architectural style for distributed hypermedia systems. Key constraints include stateless client-server communication, uniform resource interfaces via URIs, and standard HTTP methods.\n\n**PUT vs PATCH:**\n- **PUT (Replacement & Idempotent):** Used to completely replace the entire resource state at the target URI. If attributes are omitted in the request body, they are expected to be overwritten or reset to default null values. PUT is strictly idempotent: making the same PUT request 10 times results in the exact same resource state as making it once.\n- **PATCH (Partial Modification & Non-Idempotent by spec):** Used to update only specific designated fields of a resource without altering unmentioned properties. While PATCH requests can be designed to be idempotent in practice, JSON Patch sequences (like append operations) are technically not idempotent.',
    codeSnippet: '// PUT replaces the entire user entity\nPUT /api/users/123\n{ "name": "Archi Kumari", "email": "archi@example.com", "role": "student" }\n\n// PATCH updates only specific changed fields\nPATCH /api/users/123\n{ "role": "lead_engineer" }',
    keyPoints: [
      'REST relies on stateless communication, uniform URIs, and standard HTTP verbs.',
      'PUT replaces the complete entity and is idempotent.',
      'PATCH applies partial delta updates to existing fields.'
    ],
    companyTags: ['Twilio', 'Stripe', 'Amazon', 'Shopify']
  },
  {
    domain: 'Backend',
    technology: 'REST APIs',
    topic: 'API Design & HTTP Status Codes',
    difficulty: 'Intermediate',
    order: 15,
    question: 'How should RESTful APIs handle status codes (200, 201, 204, 400, 401, 403, 404, 409, 429) and cursor pagination?',
    answer: 'Proper HTTP status codes convey exact semantic outcome to API consumers:\n- **200 OK:** Successful read or update with response body.\n- **201 Created:** New resource created (returns `Location` header or created document).\n- **204 No Content:** Successful action with no response body (e.g. DELETE).\n- **400 Bad Request:** Malformed payload or validation error.\n- **401 Unauthorized:** Missing or invalid authentication credentials/token.\n- **403 Forbidden:** Authenticated user lacks permission for this specific resource.\n- **404 Not Found:** Target URI resource does not exist.\n- **409 Conflict:** State collision (e.g. duplicate email registration or duplicate job application).\n- **429 Too Many Requests:** Rate limit ceiling reached.\n\n**Cursor Pagination:** Unlike offset-based pagination (`skip=1000`) which degrades at scale and suffers from missing/duplicate items when rows are inserted, cursor pagination filters by indexed keyset pointers (`where id > cursor limit 20`), providing O(1) performance.',
    codeSnippet: '// Clean Express status response pattern\nif (!job) return res.status(404).json({ error: "Job not found" });\nif (existingApp) return res.status(409).json({ error: "Already applied" });\nreturn res.status(201).json({ success: true, application });',
    keyPoints: [
      'Status code classes: 2xx success, 4xx client errors, 5xx server faults.',
      '401 represents missing credentials; 403 represents insufficient authorization rights.',
      'Cursor-based pagination outperforms offset pagination on large datasets.'
    ],
    companyTags: ['GitHub', 'Meta', 'Stripe', 'Square']
  },

  // --- DEVOPS: GIT ---
  {
    domain: 'DevOps',
    technology: 'Git',
    topic: 'Branching Strategies & History',
    difficulty: 'Intermediate',
    order: 16,
    question: 'Explain the difference between `git merge` and `git rebase`. When should each be used?',
    answer: 'Both `git merge` and `git rebase` incorporate commits from one branch into another, but they create fundamentally different commit graphs:\n\n1. **`git merge` (Preserves History):** Creates a new "merge commit" that ties together the histories of both branches. The historical sequence and timestamps of when branches were created and merged are completely preserved. Non-destructive, but can result in cluttered history graphs with complex branch knots.\n2. **`git rebase` (Rewrites History):** Takes the commits from your feature branch, rewrites them with new hashes, and applies them sequentially on top of the tip of the target base branch (`main`). Yields a completely linear, clean history, but rewrites commit SHA hashes.\n\n**Golden Rule:** NEVER rebase commits on public, shared branches (like `main` or `develop`). Rebase locally on personal feature branches to keep history tidy before creating pull requests.',
    codeSnippet: '# Merging feature into main (creates merge commit)\ngit checkout main\ngit merge feature/auth\n\n# Rebasing local branch on latest main (linear history)\ngit checkout feature/auth\ngit rebase main',
    keyPoints: [
      '`git merge` creates a merge commit and preserves full branch topology.',
      '`git rebase` moves feature commits onto target tip, creating linear history.',
      'Never rebase shared public branches.'
    ],
    companyTags: ['GitLab', 'GitHub', 'Atlassian', 'Red Hat']
  },
  {
    domain: 'DevOps',
    technology: 'Git',
    topic: 'Conflict Resolution & Commits',
    difficulty: 'Intermediate',
    order: 17,
    question: 'What is `git cherry-pick`, and what is the best practice workflow for resolving merge conflicts safely?',
    answer: '`git cherry-pick <commit-hash>` applies the changes from an existing commit on one branch directly onto your current working branch as a brand new commit. It is ideal for backporting critical bug fixes to production branches without merging entire unfinished feature branches.\n\n**Merge Conflict Resolution Workflow:**\n1. Identify conflicting files via `git status`.\n2. Open files to inspect `<<<<<<< HEAD` (current branch), `=======` (separator), and `>>>>>>> branch` (incoming branch) conflict markers.\n3. Coordinate with author or select intended logic, saving cleaned code.\n4. Run tests/build to verify integration integrity.\n5. Stage resolved files: `git add <file>`.\n6. Finalize merge or rebase: `git commit` or `git rebase --continue`.',
    codeSnippet: '# Cherry-pick specific hotfix commit onto stable branch\ngit checkout production\ngit cherry-pick e4a2b1c',
    keyPoints: [
      '`git cherry-pick` isolates and applies specific commits across branches.',
      'Conflict markers delimit current branch logic vs incoming branch changes.',
      'Always run automated tests after resolving merge conflicts.'
    ],
    companyTags: ['Amazon', 'Google', 'Microsoft']
  },

  // --- DEVOPS: DOCKER ---
  {
    domain: 'DevOps',
    technology: 'Docker',
    topic: 'Containerization & Multi-Stage Builds',
    difficulty: 'Intermediate',
    order: 18,
    question: 'Explain the difference between a Docker Image and a Docker Container, and how multi-stage builds optimize image size.',
    answer: '1. **Docker Image:** A read-only, immutable template built from layered filesystems declared in a `Dockerfile`. It packages runtime binaries, system libraries, code, and configuration.\n2. **Docker Container:** A runnable, isolated runtime instance of an image. It adds a thin, read-write container layer on top of the underlying image layers and runs as an isolated process on the host Linux kernel using namespaces and cgroups.\n\n**Multi-Stage Builds:**\nIn standard builds, build tools (compilers, npm cache, source code) bloat production images to 1GB+. Multi-stage builds use multiple `FROM` instructions in a single `Dockerfile`. You compile code in a heavy build stage, then copy only the finalized compiled production artifacts into a tiny lightweight base image (like `alpine` or `node:slim`). This reduces image size from ~1GB to ~100MB and shrinks the attack surface.',
    codeSnippet: '# Multi-stage Dockerfile for React/Vite\nFROM node:18-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\n# Stage 2: Ultra-lightweight production server\nFROM nginx:alpine\nCOPY --from=builder /app/dist /usr/share/nginx/html\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]',
    keyPoints: [
      'Image is immutable blueprint; container is running process with read-write layer.',
      'Containers share the host OS kernel, making them lightweight compared to virtual machines.',
      'Multi-stage builds separate build dependencies from minimal production runtimes.'
    ],
    companyTags: ['Docker', 'AWS', 'Google Cloud', 'Spotify']
  },
  {
    domain: 'DevOps',
    technology: 'Docker',
    topic: 'Dockerfiles & Container Networking',
    difficulty: 'Advanced',
    order: 19,
    question: 'What is the difference between Docker `CMD` and `ENTRYPOINT`, and how do Docker bridge networks connect containers?',
    answer: 'Both `CMD` and `ENTRYPOINT` define what executable runs when a container launches:\n\n1. **`ENTRYPOINT`:** Defines the **fixed executable** that will always run when the container starts. It is not overridden by default command arguments passed to `docker run` unless `--entrypoint` is explicitly specified.\n2. **`CMD`:** Defines the **default arguments** passed to the `ENTRYPOINT`. If no `ENTRYPOINT` is defined, `CMD` acts as the command. Any arguments provided to `docker run <image> <args>` will completely override `CMD`.\n\n**Best Practice Combination:**\nUse `ENTRYPOINT` to define the binary (`ENTRYPOINT ["npm"]`) and `CMD` to provide default parameters (`CMD ["start"]`). The user can override parameters (`docker run app test`) without breaking the executable binary.\n\n**Bridge Networks:**\nDocker creates an isolated software bridge. Containers attached to the same user-defined bridge network can communicate using internal DNS resolution by container service name (e.g. `backend` connects to `mongodb:27017`) without exposing host ports.',
    codeSnippet: '# Docker Compose connecting frontend, backend and database\nservices:\n  backend:\n    image: skillgraph-backend\n    environment:\n      - MONGO_URI=mongodb://mongo:27017/skillgraph\n    depends_on:\n      - mongo\n  mongo:\n    image: mongo:6',
    keyPoints: [
      '`ENTRYPOINT` sets fixed executable binary; `CMD` supplies overridable default arguments.',
      'Exec form `["executable", "param"]` is preferred over shell form.',
      'Custom bridge networks allow inter-container DNS discovery by container name.'
    ],
    companyTags: ['Netflix', 'Uber', 'Cloudflare']
  },

  // --- FRONTEND: TYPESCRIPT ---
  {
    domain: 'Frontend',
    technology: 'TypeScript',
    topic: 'Type System & Interfaces',
    difficulty: 'Intermediate',
    order: 20,
    question: 'What are the core differences between `type` and `interface` in TypeScript, and when should you prefer one over the other?',
    answer: 'Both `interface` and `type` alias define contracts for data structures, but they have distinct capabilities:\n\n1. **Declaration Merging:** Interfaces support declaration merging (multiple `interface User` blocks in same or imported scopes automatically merge their fields). Types cannot be re-declared and will throw compiler errors. Interfaces are ideal for library public APIs and extensible models.\n2. **Unions and Primitives:** `type` can define unions (`type Role = "student" | "recruiter"`), intersections, primitives (`type ID = string | number`), and tuple types. Interfaces can only define object shapes and classes.\n3. **Extending:** Interfaces extend via `extends` keyword (`interface A extends B`). Types extend via intersection operator `&` (`type A = B & { id: string }`).\n\n**Rule of Thumb:** Use `interface` for object models and component prop contracts; use `type` for unions, mapped types, and complex conditional transformations.',
    codeSnippet: '// Union type (Impossible with interface)\ntype ApplicationStatus = "applied" | "shortlisted" | "interview" | "selected" | "rejected";\n\n// Interface with declaration merging\ninterface CandidateProfile {\n  id: string;\n  name: string;\n  status: ApplicationStatus;\n}\n\ninterface CandidateProfile {\n  verifiedSkillsCount: number; // Merged seamlessly\n}',
    keyPoints: [
      'Interfaces support declaration merging; types cannot be re-declared.',
      'Types support unions, primitives, and mapped types.',
      'Use interfaces for component props and class implementations; types for unions.'
    ],
    companyTags: ['Microsoft', 'Slack', 'Airbnb', 'DoorDash']
  },
  {
    domain: 'Frontend',
    technology: 'TypeScript',
    topic: 'Generics & Utility Types',
    difficulty: 'Advanced',
    order: 21,
    question: 'Explain Generics in TypeScript (`<T>`) and demonstrate how `Partial<T>`, `Pick<T, K>`, and `Omit<T, K>` operate under the hood.',
    answer: 'Generics allow writing flexible, reusable code components that work with a variety of types while retaining compile-time type safety instead of degrading to `any`.\n\n**Built-in Mapped Utility Types:**\n1. **`Partial<T>`:** Transforms all properties of `T` to optional (`?`):\n   `type Partial<T> = { [P in keyof T]?: T[P] };`\n   Ideal for update/patch payload functions.\n2. **`Pick<T, K>`:** Constructs a type by picking a subset of keys `K` from `T`:\n   `type Pick<T, K extends keyof T> = { [P in K]: T[P] };`\n3. **`Omit<T, K>`:** Constructs a type by picking all properties from `T` and then removing keys `K`:\n   `type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;`',
    codeSnippet: 'interface JobApplication {\n  id: string;\n  userId: string;\n  jobId: string;\n  status: string;\n  notes: string;\n}\n\n// Pick only public fields for summary view\ntype AppSummary = Pick<JobApplication, "id" | "status">;\n\n// Exclude internal IDs for form submission\ntype AppSubmission = Omit<JobApplication, "id">;\n\n// Generic API Response Envelope\ninterface ApiResponse<T> {\n  success: boolean;\n  data: T;\n}',
    keyPoints: [
      'Generics provide type parameters that preserve type information across calls.',
      '`Partial<T>` makes all keys optional using mapped property operators.',
      '`Pick` and `Omit` shape clean input/output interfaces without code duplication.'
    ],
    companyTags: ['Stripe', 'Palantir', 'Robinhood']
  },

  // --- FULL STACK: TESTING ---
  {
    domain: 'Full Stack',
    technology: 'Testing',
    topic: 'Testing Pyramid & Best Practices',
    difficulty: 'Intermediate',
    order: 22,
    question: 'Explain the Testing Pyramid (Unit, Integration, E2E) and the AAA (Arrange-Act-Assert) pattern.',
    answer: 'The **Testing Pyramid** provides an optimal distribution strategy for automated software tests:\n\n1. **Unit Tests (Base of Pyramid - 70%):** Test single functions, algorithms, or components in complete isolation. Extremely fast (milliseconds), cheap to maintain, pinpoint exact line failures (e.g. testing skill match calculation formula).\n2. **Integration Tests (Middle - 20%):** Test interactions between integrated units (e.g. Express controller + Mongoose model + MongoDB memory server). Verifies database queries, HTTP headers, middleware auth guards, and status codes.\n3. **End-to-End (E2E) Tests (Peak - 10%):** Test complete user journeys from client UI down to database (e.g. Playwright or Cypress simulating registration to job apply). Slowest, highest cost, but mirrors true end-user experience.\n\n**The AAA Pattern:**\n- **Arrange:** Set up test state, mock data, and test doubles.\n- **Act:** Execute the target function under test.\n- **Assert:** Validate that returned output and state match expected invariants.',
    codeSnippet: '// Clean AAA Pattern in Jest\ntest("clamps career match score between 0 and 100", () => {\n  // Arrange\n  const matched = 8;\n  const total = 5;\n\n  // Act\n  const score = Math.min(100, Math.max(0, Math.round((matched / total) * 100)));\n\n  // Assert\n  expect(score).toBe(100);\n});',
    keyPoints: [
      'Pyramid balances fast feedback (unit) with high confidence (E2E).',
      'AAA pattern structure: Arrange prerequisites -> Act on subject -> Assert outcomes.',
      'Integration tests verify cross-module contracts and database queries.'
    ],
    companyTags: ['Google', 'Spotify', 'Amazon', 'Meta']
  },
  {
    domain: 'Full Stack',
    technology: 'Testing',
    topic: 'Test Doubles & Isolation',
    difficulty: 'Intermediate',
    order: 23,
    question: 'What is the difference between Mocks, Stubs, and Spies in Jest, and why is mocking external network calls essential?',
    answer: 'Test doubles replace real production dependencies during testing:\n\n1. **Stub:** Returns predefined, hardcoded responses without logic or verifying how often it was called. Used to supply predictable data (e.g. stubbing a user database query).\n2. **Mock:** An object pre-programmed with expectations about which calls it should receive (e.g. verifying `emailService.send()` was invoked with exact recipient).\n3. **Spy:** Wraps an existing real function to record execution metrics (arguments passed, return values, call counts) while optionally delegating to original implementation (`jest.spyOn(console, "log")`).\n\n**Why Mock External Network Calls:**\n1. **Speed & Determinism:** Unit tests must run offline without latency.\n2. **Flakiness Elimination:** External APIs (e.g. Gemini AI, SendGrid) may experience rate limits or network drops.\n3. **Cost & Safety:** Prevents billing charges on third-party APIs and prevents sending accidental real emails during CI/CD runs.',
    codeSnippet: '// Jest Mocking Example\nconst emailService = require("./emailService");\njest.mock("./emailService");\n\ntest("dispatches notification on application status update", async () => {\n  await updateStatus(appId, "shortlisted");\n  expect(emailService.sendNotification).toHaveBeenCalledWith(\n    expect.objectContaining({ status: "shortlisted" })\n  );\n});',
    keyPoints: [
      'Stubs provide canned data; Mocks verify method interactions; Spies observe execution.',
      'Mock external services to prevent flaky tests, billing costs, and network dependencies.',
      'Clean up spies after each test (`jest.restoreAllMocks()`) to avoid cross-test pollution.'
    ],
    companyTags: ['Netflix', 'Salesforce', 'Airbnb']
  }
];

const runInterviewSeed = async () => {
  for (const q of interviewSeedData) {
    let existing = await InterviewQuestion.findOne({ question: q.question });
    if (!existing) {
      await InterviewQuestion.create(q);
      console.log(`Seeded interview question: [${q.technology}] ${q.question.substring(0, 40)}...`);
    } else {
      existing.domain = q.domain;
      existing.technology = q.technology;
      existing.topic = q.topic;
      existing.difficulty = q.difficulty;
      existing.answer = q.answer;
      existing.codeSnippet = q.codeSnippet;
      existing.keyPoints = q.keyPoints;
      existing.companyTags = q.companyTags;
      existing.order = q.order;
      await existing.save();
    }
  }
  console.log('Interview questions seeded successfully! 🎯');
};

module.exports = {
  runInterviewSeed,
  interviewSeedData
};
