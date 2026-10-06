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
