# Guided Learning Path & Prerequisite Progression System

## 1. Product Reference Inspiration
Inspired by modern guided career tracks (such as Code 360 Guided Paths), SkillGraph organizes role learning into progressive chapters and prerequisite-locked topics.
- **Sequential chapters**: Each skill required for a role forms an interactive chapter.
- **Topic prerequisites**: Foundational topics must be completed before downstream advanced topics are unlocked.
- **Topological ordering**: Foundational skills (e.g. JavaScript) precede dependent specializations (e.g. React, Next.js).

## 2. Dynamic Progression & Locking Rules
Each topic in a chapter checks upstream completion:
```javascript
const isPrereqMet = !topic.prerequisite || !!completedTopics[`${skillId}_${topic.prerequisite}`];
const isLocked = !isPrereqMet;
```
When locked:
- The topic card displays a lock badge.
- Clicking the completion button is disabled.
- An alert indicates the exact prerequisite topic required to proceed.

## 3. Real Completion Pipeline
When a student completes a topic:
1. Client triggers optimistic update and sends:
   `POST /api/learning/topics/complete` with `{ skillId, topicTitle, completed: true }`.
2. Backend saves a record in `UserTopicProgress` in MongoDB.
3. System grants **20 Learning Points** per topic.
4. Graph service updates student proficiency when milestone topics are mastered.
5. Overall career track progress percentage (`completedTopics / totalTopics * 100`) recalculates dynamically.
6. The "Resume Learning" button auto-scrolls to the next available unlocked topic.
