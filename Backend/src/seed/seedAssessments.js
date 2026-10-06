const mongoose = require('mongoose');
const Skill = require('../models/Skill');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const Assessment = require('../models/Assessment');

const seedAssessmentsData = [
  {
    skillName: 'JavaScript',
    title: 'JavaScript Core Competency Assessment',
    description: 'Evaluate fundamental knowledge of scopes, closures, asynchronous event loop, and modern ES6 features.',
    difficulty: 'intermediate',
    passingScore: 70,
    timeLimitMinutes: 20,
    questions: [
      {
        prompt: 'What is the output of the following code snippet?',
        codeSnippet: 'console.log(typeof null);\nconsole.log(typeof undefined);',
        options: [
          { id: 'a', text: '"object" and "undefined"' },
          { id: 'b', text: '"null" and "undefined"' },
          { id: 'c', text: '"undefined" and "undefined"' },
          { id: 'd', text: '"object" and "null"' }
        ],
        correctOptionId: 'a',
        explanation: 'In JavaScript, `typeof null` returns "object" due to a historical legacy bug, while `typeof undefined` returns "undefined".',
        difficulty: 'beginner'
      },
      {
        prompt: 'Which task queue does a Promise resolve handler (.then) get placed into in the JavaScript Event Loop?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'Macrotask Queue (Callback Queue)' },
          { id: 'b', text: 'Microtask Queue' },
          { id: 'c', text: 'Call Stack directly' },
          { id: 'd', text: 'Render Queue' }
        ],
        correctOptionId: 'b',
        explanation: 'Promises and mutation observers are scheduled into the Microtask Queue, which executes immediately after the current synchronous script and before the next macrotask.',
        difficulty: 'intermediate'
      },
      {
        prompt: 'What will be output by this closure snippet?',
        codeSnippet: 'for (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n}',
        options: [
          { id: 'a', text: '0, 1, 2' },
          { id: 'b', text: '3, 3, 3' },
          { id: 'c', text: 'undefined, undefined, undefined' },
          { id: 'd', text: '0, 0, 0' }
        ],
        correctOptionId: 'b',
        explanation: 'Because `var` is function-scoped rather than block-scoped, all three timeouts reference the same variable `i`, which evaluates to 3 after the loop finishes.',
        difficulty: 'intermediate'
      },
      {
        prompt: 'Which array method does NOT mutate the original array in-place?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'Array.prototype.push()' },
          { id: 'b', text: 'Array.prototype.splice()' },
          { id: 'c', text: 'Array.prototype.slice()' },
          { id: 'd', text: 'Array.prototype.sort()' }
        ],
        correctOptionId: 'c',
        explanation: '`slice()` returns a shallow copy of a portion of an array into a new array object, leaving the original array intact.',
        difficulty: 'beginner'
      },
      {
        prompt: 'What does the `===` operator check in JavaScript?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'Only values after type coercion' },
          { id: 'b', text: 'Both value and type without type coercion' },
          { id: 'c', text: 'Memory reference for primitive types only' },
          { id: 'd', text: 'Structural JSON equality' }
        ],
        correctOptionId: 'b',
        explanation: 'The strict equality operator `===` checks both value equality and type equality without performing implicit type coercion.',
        difficulty: 'beginner'
      },
      {
        prompt: 'What is the value of `this` inside an arrow function?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'It is lexically bound to the enclosing execution context' },
          { id: 'b', text: 'It always points to the global window/global object' },
          { id: 'c', text: 'It refers to the object that invoked the arrow function' },
          { id: 'd', text: 'It is undefined in all execution contexts' }
        ],
        correctOptionId: 'a',
        explanation: 'Arrow functions do not bind their own `this`; they inherit `this` from the enclosing lexical scope at creation time.',
        difficulty: 'intermediate'
      },
      {
        prompt: 'What does `Promise.all([p1, p2, p3])` do when one of the promises rejects?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'It waits for the other promises to resolve and ignores the rejected one' },
          { id: 'b', text: 'It immediately rejects with the reason of the first rejected promise' },
          { id: 'c', text: 'It converts the rejected promise into undefined' },
          { id: 'd', text: 'It automatically retries the rejected promise three times' }
        ],
        correctOptionId: 'b',
        explanation: '`Promise.all` fails fast: if any promise in the input array rejects, the returned promise immediately rejects with that rejection reason.',
        difficulty: 'intermediate'
      },
      {
        prompt: 'What is the purpose of the `WeakMap` data structure in JavaScript?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'To allow keys to be garbage-collected when there are no other references to them' },
          { id: 'b', text: 'To store numbers in descending order' },
          { id: 'c', text: 'To prevent duplicate string keys across modules' },
          { id: 'd', text: 'To serialize nested functions into JSON' }
        ],
        correctOptionId: 'a',
        explanation: '`WeakMap` keys must be objects and are held weakly, meaning they do not prevent garbage collection if no other references to the object key exist.',
        difficulty: 'advanced'
      },
      {
        prompt: 'What is the output of `0.1 + 0.2 === 0.3` in JavaScript?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'true' },
          { id: 'b', text: 'false' },
          { id: 'c', text: 'TypeError' },
          { id: 'd', text: 'NaN' }
        ],
        correctOptionId: 'b',
        explanation: 'Due to IEEE 754 floating-point precision limitations, `0.1 + 0.2` evaluates to `0.30000000000000004`, which is not strictly equal to `0.3`.',
        difficulty: 'intermediate'
      },
      {
        prompt: 'What does `Object.freeze(obj)` accomplish?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'Prevents adding, removing, or modifying properties on the top-level object' },
          { id: 'b', text: 'Performs a deep recursive freeze of all nested object properties' },
          { id: 'c', text: 'Encrypts the object in local storage' },
          { id: 'd', text: 'Makes all properties private to class instances' }
        ],
        correctOptionId: 'a',
        explanation: '`Object.freeze()` performs a shallow freeze on the object, preventing new properties from being added and existing properties from being altered or removed.',
        difficulty: 'intermediate'
      }
    ]
  },
  {
    skillName: 'React',
    title: 'React Components & Hooks Assessment',
    description: 'Test your understanding of component lifecycle, hooks rules, state management, and the Virtual DOM.',
    difficulty: 'intermediate',
    passingScore: 70,
    timeLimitMinutes: 20,
    questions: [
      {
        prompt: 'Why should you avoid directly mutating state variables in React?',
        codeSnippet: '// Bad:\nstate.count = state.count + 1;',
        options: [
          { id: 'a', text: 'Direct mutation bypasses React reconciliation and will not trigger a re-render' },
          { id: 'b', text: 'Direct mutation throws a synchronous JavaScript SyntaxError' },
          { id: 'c', text: 'Direct mutation is forbidden by HTML5 specification' },
          { id: 'd', text: 'Direct mutation breaks CSS styling inheritance' }
        ],
        correctOptionId: 'a',
        explanation: 'React relies on reference comparison to detect state changes. Mutating state directly does not produce a new reference, so React will not re-render the component.',
        difficulty: 'beginner'
      },
      {
        prompt: 'When does the cleanup function returned by `useEffect` execute?',
        codeSnippet: 'useEffect(() => {\n  return () => { /* cleanup */ };\n}, [dep]);',
        options: [
          { id: 'a', text: 'Only when the server shuts down' },
          { id: 'b', text: 'Before the effect re-runs when dependencies change and when the component unmounts' },
          { id: 'c', text: 'Immediately after the initial render only' },
          { id: 'd', text: 'Only in production builds' }
        ],
        correctOptionId: 'b',
        explanation: 'The cleanup function is executed before running the effect on subsequent renders if dependencies change, and also when the component unmounts.',
        difficulty: 'intermediate'
      },
      {
        prompt: 'What is the primary benefit of React’s Virtual DOM?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'It connects directly to the GPU for hardware-accelerated 3D rendering' },
          { id: 'b', text: 'It computes minimal DOM diffs in memory before applying efficient batch updates to the real DOM' },
          { id: 'c', text: 'It compiles React code into WebAssembly binary' },
          { id: 'd', text: 'It replaces HTTP requests with WebSockets' }
        ],
        correctOptionId: 'b',
        explanation: 'The Virtual DOM allows React to calculate changes through diffing algorithms and only update what is necessary in the real DOM, avoiding expensive layout reflows.',
        difficulty: 'intermediate'
      },
      {
        prompt: 'Which hook should you use to preserve a mutable value across renders without causing a re-render when changed?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'useState' },
          { id: 'b', text: 'useMemo' },
          { id: 'c', text: 'useRef' },
          { id: 'd', text: 'useReducer' }
        ],
        correctOptionId: 'c',
        explanation: '`useRef` returns a mutable object whose `.current` property persists for the lifetime of the component and updating it does NOT trigger a re-render.',
        difficulty: 'intermediate'
      },
      {
        prompt: 'Why must React components and hooks be called at the top level?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'To ensure that hooks are called in the exact same order on every render' },
          { id: 'b', text: 'Because JavaScript does not allow functions inside conditionals' },
          { id: 'c', text: 'To allow Webpack to tree-shake unused hooks' },
          { id: 'd', text: 'Because variables inside loops are converted to symbols' }
        ],
        correctOptionId: 'a',
        explanation: 'React relies on the call order of hooks across render cycles to correctly pair state and effects with internal fiber node linked lists.',
        difficulty: 'intermediate'
      },
      {
        prompt: 'What is the primary purpose of the `key` prop when rendering lists of elements in React?',
        codeSnippet: 'items.map(item => <Item key={item.id} {...item} />)',
        options: [
          { id: 'a', text: 'To uniquely identify which items have changed, been added, or been removed during reconciliation' },
          { id: 'b', text: 'To securely encrypt list items over the network' },
          { id: 'c', text: 'To apply automatic alternating row CSS styles' },
          { id: 'd', text: 'To bind onClick event handlers automatically' }
        ],
        correctOptionId: 'a',
        explanation: 'Keys give elements a stable identity across renders, allowing React to efficiently update and reorder list elements without recreating entire DOM subtrees.',
        difficulty: 'beginner'
      },
      {
        prompt: 'What does `useCallback(fn, deps)` return?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'A memoized version of the callback function that only changes if dependencies change' },
          { id: 'b', text: 'The computed return value of executing the function' },
          { id: 'c', text: 'A Promise that resolves with the function result' },
          { id: 'd', text: 'A ref pointing to the underlying DOM node' }
        ],
        correctOptionId: 'a',
        explanation: '`useCallback` caches a function definition between renders, ensuring its reference remains stable when passed as a prop to memoized child components.',
        difficulty: 'intermediate'
      },
      {
        prompt: 'How does React 18 handle automatic batching for state updates?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'Batches state updates inside promises, setTimeout, and native events, not just React event handlers' },
          { id: 'b', text: 'Disables batching in development mode' },
          { id: 'c', text: 'Only batches state updates for class components' },
          { id: 'd', text: 'Batching requires wrapping updates in ReactDOM.batch()' }
        ],
        correctOptionId: 'a',
        explanation: 'React 18 introduced Automatic Batching across all contexts, including setTimeout, promises, and native event listeners, minimizing re-renders.',
        difficulty: 'advanced'
      },
      {
        prompt: 'When should you choose `useReducer` over `useState`?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'When managing complex state logic that involves multiple sub-values or when the next state depends on previous state' },
          { id: 'b', text: 'Only when connecting to Redux store' },
          { id: 'c', text: 'Whenever components have more than two props' },
          { id: 'd', text: 'Only inside custom hooks' }
        ],
        correctOptionId: 'a',
        explanation: '`useReducer` is preferable for complex state transition logic, state containing nested properties, or when state mutations follow distinct action types.',
        difficulty: 'intermediate'
      },
      {
        prompt: 'What does React Context solve, and what is its primary caveat?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'Solves prop drilling; caveat is that all consuming components re-render whenever the context value changes' },
          { id: 'b', text: 'Solves database querying; caveat is that it only works on the server' },
          { id: 'c', text: 'Replaces WebSockets; caveat is high network latency' },
          { id: 'd', text: 'Replaces CSS modules; caveat is browser incompatibility' }
        ],
        correctOptionId: 'a',
        explanation: 'Context prevents prop drilling through intermediate components, but any change to the provided value triggers re-renders in all subscribing consumers.',
        difficulty: 'intermediate'
      }
    ]
  },
  {
    skillName: 'Node.js',
    title: 'Node.js & Express Architecture Assessment',
    description: 'Verify your proficiency in asynchronous server programming, Express middleware, streams, and error handling.',
    difficulty: 'intermediate',
    passingScore: 70,
    timeLimitMinutes: 20,
    questions: [
      {
        prompt: 'In Express.js, what does the `next()` function call do inside a middleware handler?',
        codeSnippet: 'app.use((req, res, next) => {\n  // do work\n  next();\n});',
        options: [
          { id: 'a', text: 'It immediately sends an HTTP 200 OK response to the client' },
          { id: 'b', text: 'It passes control to the next middleware in the request-response pipeline' },
          { id: 'c', text: 'It restarts the Node.js server cluster' },
          { id: 'd', text: 'It executes the next database migration' }
        ],
        correctOptionId: 'b',
        explanation: 'Calling `next()` in Express hands execution to the next matching middleware function in the stack.',
        difficulty: 'beginner'
      },
      {
        prompt: 'How should an Express error-handling middleware be defined?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'With 4 parameters: `(err, req, res, next)`' },
          { id: 'b', text: 'With 2 parameters: `(req, res)`' },
          { id: 'c', text: 'Inside a try-catch block in `server.js` only' },
          { id: 'd', text: 'Using the `express.onError()` global listener' }
        ],
        correctOptionId: 'a',
        explanation: 'Express recognizes error-handling middleware specifically by checking that the function takes exactly 4 arguments: `(err, req, res, next)`.',
        difficulty: 'intermediate'
      },
      {
        prompt: 'What happens when a synchronous CPU-intensive loop is executed on the main Node.js thread?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'Node automatically offloads it to secondary worker threads without configuration' },
          { id: 'b', text: 'It blocks the event loop, preventing incoming requests from being processed' },
          { id: 'c', text: 'The garbage collector terminates the process' },
          { id: 'd', text: 'It runs in parallel with libuv I/O polling' }
        ],
        correctOptionId: 'b',
        explanation: 'Because Node.js runs JavaScript on a single thread, heavy synchronous operations block the event loop and stall all subsequent network requests.',
        difficulty: 'intermediate'
      },
      {
        prompt: 'Which core module in Node.js handles file system operations like reading and writing files?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'http' },
          { id: 'b', text: 'fs (File System)' },
          { id: 'c', text: 'path' },
          { id: 'd', text: 'os' }
        ],
        correctOptionId: 'b',
        explanation: 'The `fs` module provides both synchronous and asynchronous (callback/promise-based) methods for interacting with the file system.',
        difficulty: 'beginner'
      },
      {
        prompt: 'What does the `cluster` module in Node.js allow developers to do?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'Spawn child worker processes that share server ports across multiple CPU cores' },
          { id: 'b', text: 'Automatically shard MongoDB database clusters' },
          { id: 'c', text: 'Compress static CSS and JavaScript files' },
          { id: 'd', text: 'Encrypt HTTPS SSL certificates automatically' }
        ],
        correctOptionId: 'a',
        explanation: 'The `cluster` module enables creating multiple child processes (workers) that share the same server port, taking advantage of multi-core CPU architectures.',
        difficulty: 'advanced'
      },
      {
        prompt: 'What is the purpose of Node.js Streams?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'To process large data in chunks sequentially without loading the entire dataset into memory' },
          { id: 'b', text: 'To manage WebRTC audio streams only' },
          { id: 'c', text: 'To replace Express route controllers' },
          { id: 'd', text: 'To generate random number sequences' }
        ],
        correctOptionId: 'a',
        explanation: 'Streams allow applications to read or write data piece-by-piece, dramatically reducing memory consumption for large file uploads, downloads, or transformations.',
        difficulty: 'intermediate'
      },
      {
        prompt: 'What is the difference between `process.nextTick()` and `setImmediate()` in Node.js?',
        codeSnippet: '',
        options: [
          { id: 'a', text: '`process.nextTick` executes immediately after current operation completes; `setImmediate` runs in the Check phase of the event loop' },
          { id: 'b', text: '`setImmediate` runs before `process.nextTick`' },
          { id: 'c', text: '`process.nextTick` only runs in browser environments' },
          { id: 'd', text: 'They are aliases with identical timing' }
        ],
        correctOptionId: 'a',
        explanation: '`process.nextTick()` queues callbacks to execute prior to advancing to the next event loop phase, whereas `setImmediate()` runs during the Check phase.',
        difficulty: 'advanced'
      },
      {
        prompt: 'Why should sensitive secrets like JWT secrets and DB connection strings NOT be committed to git repositories?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'Exposed secrets can be compromised by bad actors, leading to data breaches; use environment variables instead' },
          { id: 'b', text: 'Git will reject commits containing strings with special characters' },
          { id: 'c', text: 'Node.js cannot read variables from plain text files' },
          { id: 'd', text: 'It slows down git commit execution time' }
        ],
        correctOptionId: 'a',
        explanation: 'Committing credentials creates critical security vulnerabilities. Secure applications load sensitive configuration via environment variables at runtime.',
        difficulty: 'beginner'
      },
      {
        prompt: 'What does middleware like `helmet` do in an Express application?',
        codeSnippet: 'app.use(helmet());',
        options: [
          { id: 'a', text: 'Sets various security-related HTTP response headers to protect against common web vulnerabilities' },
          { id: 'b', text: 'Caches database responses in Redis' },
          { id: 'c', text: 'Minifies HTML output files' },
          { id: 'd', text: 'Validates user passwords using bcrypt' }
        ],
        correctOptionId: 'a',
        explanation: 'Helmet configures HTTP security headers (e.g. Content-Security-Policy, X-Frame-Options, X-Content-Type-Options) to mitigate attacks like clickjacking and XSS.',
        difficulty: 'intermediate'
      },
      {
        prompt: 'What is the standard HTTP status code returned for an unauthorized request where authentication is required but missing or invalid?',
        codeSnippet: '',
        options: [
          { id: 'a', text: '401 Unauthorized' },
          { id: 'b', text: '403 Forbidden' },
          { id: 'c', text: '404 Not Found' },
          { id: 'd', text: '500 Server Error' }
        ],
        correctOptionId: 'a',
        explanation: 'HTTP 401 indicates that the request lacks valid authentication credentials. HTTP 403 indicates the user is authenticated but lacks required permissions.',
        difficulty: 'beginner'
      }
    ]
  },
  {
    skillName: 'MongoDB',
    title: 'MongoDB & Database Design Assessment',
    description: 'Verify your understanding of document collections, indexing, Mongoose schemas, and aggregation pipelines.',
    difficulty: 'intermediate',
    passingScore: 70,
    timeLimitMinutes: 20,
    questions: [
      {
        prompt: 'What is the primary function of creating an index on a MongoDB field?',
        codeSnippet: 'userSchema.index({ email: 1 });',
        options: [
          { id: 'a', text: 'To encrypt the field on the disk' },
          { id: 'b', text: 'To dramatically speed up query searches by avoiding full collection scans (COLLSCAN)' },
          { id: 'c', text: 'To convert strings to binary numbers' },
          { id: 'd', text: 'To automatically backup the collection daily' }
        ],
        correctOptionId: 'b',
        explanation: 'Indexes store a small portion of the collection dataset in an easily traversable B-tree structure, allowing queries to be answered without scanning every single document.',
        difficulty: 'beginner'
      },
      {
        prompt: 'Which stage in a MongoDB aggregation pipeline is used to filter documents similar to `find()`?',
        codeSnippet: '',
        options: [
          { id: 'a', text: '$project' },
          { id: 'b', text: '$group' },
          { id: 'c', text: '$match' },
          { id: 'd', text: '$unwind' }
        ],
        correctOptionId: 'c',
        explanation: '`$match` filters the document stream to allow only matching documents to pass through to the next aggregation stage.',
        difficulty: 'beginner'
      },
      {
        prompt: 'What does the `$unwind` stage do in a MongoDB aggregation pipeline?',
        codeSnippet: '{ $unwind: "$requirements" }',
        options: [
          { id: 'a', text: 'Deconstructs an array field from the input documents to output a document for each element in the array' },
          { id: 'b', text: 'Deletes the specified array field permanently' },
          { id: 'c', text: 'Sorts array elements in descending order' },
          { id: 'd', text: 'Combines multiple array fields into a single string' }
        ],
        correctOptionId: 'a',
        explanation: '`$unwind` flattens an array field, emitting a copy of each parent document for every item contained in the array.',
        difficulty: 'intermediate'
      },
      {
        prompt: 'In Mongoose, what is the difference between referencing (normalization) and embedding (denormalization)?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'Referencing stores ObjectIds linking documents across collections; embedding nests child documents directly inside parent documents' },
          { id: 'b', text: 'Referencing is only supported in relational SQL databases' },
          { id: 'c', text: 'Embedding restricts documents to a maximum of 100 bytes' },
          { id: 'd', text: 'Referencing requires manual JSON serialization' }
        ],
        correctOptionId: 'a',
        explanation: 'Embedding keeps related data together in a single document for fast atomic reads, while referencing points to documents in separate collections to avoid duplicate data.',
        difficulty: 'intermediate'
      },
      {
        prompt: 'What is the maximum BSON document size supported by MongoDB?',
        codeSnippet: '',
        options: [
          { id: 'a', text: '16 Megabytes' },
          { id: 'b', text: '4 Megabytes' },
          { id: 'c', text: '64 Megabytes' },
          { id: 'd', text: 'Unlimited' }
        ],
        correctOptionId: 'a',
        explanation: 'The maximum BSON document size is 16MB. Storing larger binary files (like videos or large PDFs) typically utilizes GridFS.',
        difficulty: 'intermediate'
      },
      {
        prompt: 'What does the `upsert: true` option accomplish in MongoDB update operations?',
        codeSnippet: 'await Model.updateOne({ email }, { $set: updateData }, { upsert: true });',
        options: [
          { id: 'a', text: 'Updates the document if it exists, or creates a new document if no matching document is found' },
          { id: 'b', text: 'Forces an immediate database flush to disk' },
          { id: 'c', text: 'Upgrades the database version' },
          { id: 'd', text: 'Deletes duplicate documents before inserting' }
        ],
        correctOptionId: 'a',
        explanation: 'Upsert (update or insert) modifies the document matching filter criteria, or creates a new document matching the filter plus update operations if no match exists.',
        difficulty: 'beginner'
      },
      {
        prompt: 'What query method is used in MongoDB to analyze query execution plan and verify index usage?',
        codeSnippet: '',
        options: [
          { id: 'a', text: '.explain("executionStats")' },
          { id: 'b', text: '.debug()' },
          { id: 'c', text: '.analyze()' },
          { id: 'd', text: '.inspect()' }
        ],
        correctOptionId: 'a',
        explanation: '`.explain("executionStats")` returns metrics on execution stages (`IXSCAN` vs `COLLSCAN`), total documents examined, and execution time.',
        difficulty: 'intermediate'
      },
      {
        prompt: 'What is a TTL (Time-To-Live) index in MongoDB used for?',
        codeSnippet: 'schema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });',
        options: [
          { id: 'a', text: 'Automatically deleting documents after a specified amount of time or at a specific clock time' },
          { id: 'b', text: 'Measuring network round-trip latency' },
          { id: 'c', text: 'Limiting query execution time' },
          { id: 'd', text: 'Backing up collections hourly' }
        ],
        correctOptionId: 'a',
        explanation: 'TTL indexes allow MongoDB to automatically purge expired documents, ideal for session storage, temporary auth tokens, and audit logs.',
        difficulty: 'intermediate'
      },
      {
        prompt: 'How does MongoDB handle atomic operations?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'Write operations are atomic at the single-document level' },
          { id: 'b', text: 'MongoDB does not support any atomic operations' },
          { id: 'c', text: 'All operations require external two-phase commits' },
          { id: 'd', text: 'Only read queries are atomic' }
        ],
        correctOptionId: 'a',
        explanation: 'Single-document write operations in MongoDB are always atomic. For multi-document atomicity, MongoDB supports multi-document transactions in replica sets.',
        difficulty: 'intermediate'
      },
      {
        prompt: 'What does the `$lookup` stage in an aggregation pipeline perform?',
        codeSnippet: '{ $lookup: { from: "skills", localField: "skillId", foreignField: "_id", as: "skill" } }',
        options: [
          { id: 'a', text: 'Performs a left outer join to documents in another collection within the same database' },
          { id: 'b', text: 'Searches for text in an external Elasticsearch cluster' },
          { id: 'c', text: 'Performs a DNS lookup on user IP addresses' },
          { id: 'd', text: 'Downloads images from cloud storage' }
        ],
        correctOptionId: 'a',
        explanation: '`$lookup` brings in matching documents from a foreign collection as an array field, providing relational JOIN capability inside aggregation workflows.',
        difficulty: 'intermediate'
      }
    ]
  }
];

const runAssessmentSeed = async () => {
  console.log('--- Seeding Assessments and Questions ---');

  for (const item of seedAssessmentsData) {
    const skill = await Skill.findOne({ name: item.skillName });
    if (!skill) {
      console.warn(`Skill ${item.skillName} not found, skipping assessment.`);
      continue;
    }

    // Seed questions
    const questionIds = [];
    for (const q of item.questions) {
      let existingQ = await Question.findOne({
        skillId: skill._id,
        prompt: q.prompt
      });

      if (!existingQ) {
        existingQ = await Question.create({
          skillId: skill._id,
          prompt: q.prompt,
          codeSnippet: q.codeSnippet || '',
          options: q.options,
          correctOptionId: q.correctOptionId,
          explanation: q.explanation || '',
          difficulty: q.difficulty || item.difficulty
        });
        console.log(`Created question for ${item.skillName}: "${q.prompt.slice(0, 40)}..."`);
      } else {
        existingQ.options = q.options;
        existingQ.correctOptionId = q.correctOptionId;
        existingQ.explanation = q.explanation;
        existingQ.codeSnippet = q.codeSnippet || '';
        await existingQ.save();
      }
      questionIds.push(existingQ._id);
    }

    // Seed or update Assessment
    let assessment = await Assessment.findOne({ skillId: skill._id, title: item.title });
    if (!assessment) {
      assessment = await Assessment.create({
        skillId: skill._id,
        title: item.title,
        description: item.description,
        difficulty: item.difficulty,
        passingScore: item.passingScore,
        timeLimitMinutes: item.timeLimitMinutes,
        questions: questionIds,
        isActive: true
      });
      console.log(`Created Assessment: ${item.title} with ${questionIds.length} questions`);
    } else {
      assessment.description = item.description;
      assessment.difficulty = item.difficulty;
      assessment.passingScore = item.passingScore;
      assessment.timeLimitMinutes = item.timeLimitMinutes;
      assessment.questions = questionIds;
      assessment.isActive = true;
      await assessment.save();
      console.log(`Updated Assessment: ${item.title} with ${questionIds.length} questions`);
    }
  }

  console.log('Assessments & Questions seeded successfully.');
};

module.exports = {
  runAssessmentSeed,
  seedAssessmentsData
};
