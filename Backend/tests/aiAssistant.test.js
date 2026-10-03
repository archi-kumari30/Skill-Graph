const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Skill = require('../src/models/Skill');
const Role = require('../src/models/Role');
const RoleSkill = require('../src/models/RoleSkill');
const UserSkill = require('../src/models/UserSkill');
const ChatMessage = require('../src/models/ChatMessage');

describe('Module 10: AI Career Assistant, SSE Streaming & Chat History Tests', () => {
  let studentToken;
  let studentUser;
  let secondStudentToken;
  let secondStudentUser;

  let reactSkill;
  let targetRole;

  beforeEach(async () => {
    // 1. Seed Skill
    reactSkill = await Skill.create({ name: 'React', category: 'Frontend' });

    // 2. Seed Role
    targetRole = await Role.create({
      name: 'Frontend Engineer',
      department: 'Engineering',
      level: 'junior'
    });

    await RoleSkill.create({
      roleId: targetRole._id,
      skillId: reactSkill._id,
      requiredProficiency: 3,
      importance: 'required'
    });

    // 3. Register Student 1
    const stu1Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jordan Lee',
        email: 'jordan.lee@test.com',
        password: 'password123',
        accountRole: 'student'
      });
    studentToken = stu1Res.body.data.token;
    studentUser = stu1Res.body.data.user;

    // Set target role and skill for student 1
    await User.findByIdAndUpdate(studentUser._id, { targetRoleId: targetRole._id });
    await UserSkill.create({
      userId: studentUser._id,
      skillId: reactSkill._id,
      proficiency: 2
    });

    // 4. Register Student 2 (for isolation test)
    const stu2Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Morgan Smith',
        email: 'morgan.smith@test.com',
        password: 'password123',
        accountRole: 'student'
      });
    secondStudentToken = stu2Res.body.data.token;
    secondStudentUser = stu2Res.body.data.user;
  });

  describe('1. Authentication & Input Validation', () => {
    it('should reject unauthenticated requests to AI endpoints with 401', async () => {
      const chatRes = await request(app).post('/api/ai/chat').send({ message: 'Hello' });
      const streamRes = await request(app).post('/api/ai/chat/stream').send({ message: 'Hello' });
      const historyRes = await request(app).get('/api/ai/history');

      expect(chatRes.statusCode).toBe(401);
      expect(streamRes.statusCode).toBe(401);
      expect(historyRes.statusCode).toBe(401);
    });

    it('should reject empty or whitespace message with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ message: '   ' });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.message).toContain('Message cannot be empty');
    });

    it('should reject message exceeding character limit with 400 Bad Request', async () => {
      const longMessage = 'A'.repeat(2500);
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ message: longMessage });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.message).toContain('exceeds maximum limit');
    });
  });

  describe('2. Grounded Guidance & Persistent Chat History', () => {
    it('should provide advice grounded in student profile and persist conversation', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ message: 'How can I prepare for my target role?' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reply).toBeDefined();

      // Check reply mentions target role or skills
      const reply = res.body.data.reply;
      expect(reply.length).toBeGreaterThan(20);

      // Verify messages are persisted in MongoDB
      const history = await ChatMessage.find({ userId: studentUser._id }).sort({ createdAt: 1 });
      expect(history.length).toBe(2);
      expect(history[0].role).toBe('user');
      expect(history[0].content).toBe('How can I prepare for my target role?');
      expect(history[1].role).toBe('assistant');
      expect(history[1].content).toBe(reply);
    });

    it('should retrieve conversation history in chronological order via GET /api/ai/history', async () => {
      await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ message: 'Question 1' });

      await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ message: 'Question 2' });

      const res = await request(app)
        .get('/api/ai/history')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.messages.length).toBe(4); // 2 user + 2 assistant
      expect(res.body.data.messages[0].content).toBe('Question 1');
      expect(res.body.data.messages[2].content).toBe('Question 2');
    });

    it('should isolate chat history between different students', async () => {
      // Student 1 asks a question
      await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ message: 'Secret Student 1 Question' });

      // Student 2 queries history
      const res = await request(app)
        .get('/api/ai/history')
        .set('Authorization', `Bearer ${secondStudentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.messages.length).toBe(0);
    });

    it('should clear only requesting student history via DELETE /api/ai/history', async () => {
      // Both students post messages
      await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ message: 'Student 1 Message' });

      await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${secondStudentToken}`)
        .send({ message: 'Student 2 Message' });

      // Student 1 clears history
      const delRes = await request(app)
        .delete('/api/ai/history')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(delRes.statusCode).toBe(200);
      expect(delRes.body.message).toContain('cleared successfully');

      // Student 1 has 0 messages
      const stu1History = await ChatMessage.find({ userId: studentUser._id });
      expect(stu1History.length).toBe(0);

      // Student 2 still has their 2 messages
      const stu2History = await ChatMessage.find({ userId: secondStudentUser._id });
      expect(stu2History.length).toBe(2);
    });
  });

  describe('3. Server-Sent Events (SSE) Real-Time Streaming', () => {
    it('should stream chat response tokens via SSE endpoint POST /api/ai/chat/stream', async () => {
      const res = await request(app)
        .post('/api/ai/chat/stream')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ message: 'What skills should I learn next?' });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/event-stream');

      // Verify stream data contains SSE format and [DONE]
      const text = res.text;
      expect(text).toContain('data: ');
      expect(text).toContain('[DONE]');

      // Verify stream also persisted the conversation
      const history = await ChatMessage.find({ userId: studentUser._id }).sort({ createdAt: 1 });
      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history[history.length - 2].role).toBe('user');
      expect(history[history.length - 1].role).toBe('assistant');
    });
  });

  describe('4. AI Status Endpoint', () => {
    it('should report configuration status via GET /api/ai/status', async () => {
      const res = await request(app).get('/api/ai/status');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.configured).toBeDefined();
    });
  });
});
