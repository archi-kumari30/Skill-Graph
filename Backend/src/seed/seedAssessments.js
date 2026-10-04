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
    timeLimitMinutes: 15,
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
      }
    ]
  },
  {
    skillName: 'React',
    title: 'React Components & Hooks Assessment',
    description: 'Test your understanding of component lifecycle, hooks rules, state management, and the Virtual DOM.',
    difficulty: 'intermediate',
    passingScore: 70,
    timeLimitMinutes: 15,
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
      }
    ]
  },
  {
    skillName: 'Node.js',
    title: 'Node.js & Express Architecture Assessment',
    description: 'Verify your proficiency in asynchronous server programming, Express middleware, streams, and error handling.',
    difficulty: 'intermediate',
    passingScore: 70,
    timeLimitMinutes: 15,
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
      }
    ]
  },
  {
    skillName: 'MongoDB',
    title: 'MongoDB & Database Design Assessment',
    description: 'Verify your understanding of document collections, indexing, Mongoose schemas, and aggregation pipelines.',
    difficulty: 'intermediate',
    passingScore: 70,
    timeLimitMinutes: 15,
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
        explanation: '`$match` filters documents to allow only those that match specified condition(s) to pass to the next pipeline stage.',
        difficulty: 'intermediate'
      },
      {
        prompt: 'What is a MongoDB `ObjectId` composed of?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'A random 32-bit integer' },
          { id: 'b', text: 'A 12-byte identifier including timestamp, random machine value, and incrementing counter' },
          { id: 'c', text: 'An SHA-256 hash of the document content' },
          { id: 'd', text: 'A UUID v4 string' }
        ],
        correctOptionId: 'b',
        explanation: 'A 12-byte BSON ObjectId consists of a 4-byte Unix timestamp, a 5-byte random value, and a 3-byte incrementing counter.',
        difficulty: 'intermediate'
      }
    ]
  },
  {
    skillName: 'HTML',
    title: 'HTML5 & Semantic Markup Assessment',
    description: 'Test knowledge of accessible semantic tags, form controls, and modern web document structure.',
    difficulty: 'beginner',
    passingScore: 70,
    timeLimitMinutes: 10,
    questions: [
      {
        prompt: 'Which HTML element should be used to represent the major navigation links of a website?',
        codeSnippet: '',
        options: [
          { id: 'a', text: '<menu>' },
          { id: 'b', text: '<nav>' },
          { id: 'c', text: '<section>' },
          { id: 'd', text: '<links>' }
        ],
        correctOptionId: 'b',
        explanation: 'The `<nav>` semantic element represents a section of a page that links to other pages or parts within the page.',
        difficulty: 'beginner'
      },
      {
        prompt: 'What is the purpose of the `alt` attribute on an `<img>` tag?',
        codeSnippet: '<img src="profile.jpg" alt="User avatar" />',
        options: [
          { id: 'a', text: 'It sets an alternate URL if the image server fails' },
          { id: 'b', text: 'It provides an accessible text description for screen readers and search engines' },
          { id: 'c', text: 'It determines image compression quality' },
          { id: 'd', text: 'It specifies hover tooltip text in modern browsers' }
        ],
        correctOptionId: 'b',
        explanation: 'The `alt` attribute provides alternative text for accessibility (screen readers) and displays if the image cannot be loaded.',
        difficulty: 'beginner'
      },
      {
        prompt: 'What does the `<!DOCTYPE html>` declaration at the top of an HTML file do?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'It tells the browser to render the document in standards mode for HTML5' },
          { id: 'b', text: 'It imports external HTML stylesheets' },
          { id: 'c', text: 'It enables JavaScript execution in the browser' },
          { id: 'd', text: 'It defines the root element of the DOM' }
        ],
        correctOptionId: 'a',
        explanation: 'The `<!DOCTYPE html>` declaration ensures the browser operates in standards mode rather than quirks mode.',
        difficulty: 'beginner'
      }
    ]
  },
  {
    skillName: 'CSS',
    title: 'CSS Layouts & Responsive Design Assessment',
    description: 'Evaluate mastery of Flexbox, Grid, CSS specificity, and responsive media queries.',
    difficulty: 'beginner',
    passingScore: 70,
    timeLimitMinutes: 10,
    questions: [
      {
        prompt: 'What is the difference between `justify-content` and `align-items` in CSS Flexbox?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'justify-content aligns items along the main axis; align-items aligns items along the cross axis' },
          { id: 'b', text: 'justify-content aligns text; align-items aligns images' },
          { id: 'c', text: 'justify-content is for Grid; align-items is for Flexbox' },
          { id: 'd', text: 'There is no difference; they are aliases for the same property' }
        ],
        correctOptionId: 'a',
        explanation: 'In Flexbox, `justify-content` defines the alignment along the main axis (default horizontal), and `align-items` defines alignment along the cross axis (default vertical).',
        difficulty: 'beginner'
      },
      {
        prompt: 'Which CSS selector has the highest specificity?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'Tag selector: `div`' },
          { id: 'b', text: 'Class selector: `.header-title`' },
          { id: 'c', text: 'ID selector: `#main-header`' },
          { id: 'd', text: 'Universal selector: `*`' }
        ],
        correctOptionId: 'c',
        explanation: 'ID selectors (0,1,0,0) have higher specificity than class selectors (0,0,1,0) and element tag selectors (0,0,0,1).',
        difficulty: 'beginner'
      },
      {
        prompt: 'What does `box-sizing: border-box;` do?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'It includes padding and border within the specified element width and height' },
          { id: 'b', text: 'It excludes padding and borders from total element dimensions' },
          { id: 'c', text: 'It forces borders to render with 3D shadows' },
          { id: 'd', text: 'It disables responsive percentage widths' }
        ],
        correctOptionId: 'a',
        explanation: '`border-box` causes padding and borders to be included within the element width and height rather than expanding it.',
        difficulty: 'beginner'
      }
    ]
  },
  {
    skillName: 'Git',
    title: 'Git Version Control Assessment',
    description: 'Assess command-line version control, branch workflows, merging, and collaboration.',
    difficulty: 'beginner',
    passingScore: 70,
    timeLimitMinutes: 10,
    questions: [
      {
        prompt: 'What is the key difference between `git merge` and `git rebase`?',
        codeSnippet: '',
        options: [
          { id: 'a', text: '`git merge` creates a merge commit preserving full branch history; `git rebase` rewrites commits linearly onto the base branch' },
          { id: 'b', text: '`git merge` deletes commits; `git rebase` duplicates repositories' },
          { id: 'c', text: '`git rebase` only works on remote repositories' },
          { id: 'd', text: 'They perform the exact same operation with no difference' }
        ],
        correctOptionId: 'a',
        explanation: 'Merging retains all original branch commits and joins them with a merge commit. Rebasing reapplies commits from one branch on top of another to achieve a clean linear commit history.',
        difficulty: 'intermediate'
      },
      {
        prompt: 'Which command stages all modified and newly created files for the next commit?',
        codeSnippet: '',
        options: [
          { id: 'a', text: 'git commit -m "all"' },
          { id: 'b', text: 'git add .' },
          { id: 'c', text: 'git push origin main' },
          { id: 'd', text: 'git status' }
        ],
        correctOptionId: 'b',
        explanation: '`git add .` stages all changes in the current directory and subdirectories to the Git staging index.',
        difficulty: 'beginner'
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
      console.log(`Created Assessment: ${item.title}`);
    } else {
      assessment.description = item.description;
      assessment.difficulty = item.difficulty;
      assessment.passingScore = item.passingScore;
      assessment.timeLimitMinutes = item.timeLimitMinutes;
      assessment.questions = questionIds;
      assessment.isActive = true;
      await assessment.save();
      console.log(`Updated Assessment: ${item.title}`);
    }
  }

  console.log('Assessments & Questions seeded successfully.');
};

module.exports = {
  runAssessmentSeed
};
