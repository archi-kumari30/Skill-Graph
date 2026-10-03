const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const AuthToken = require('../src/models/AuthToken');

describe('Module 03: Authentication & RBAC Test Suite', () => {
  let studentUser;
  let employeeUser;
  let managerUser;
  let adminUser;

  let studentToken;
  let employeeToken;
  let managerToken;
  let adminToken;

  let studentCookie;
  let employeeCookie;

  beforeEach(async () => {
    // 1. Register student
    const studentRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Student Alice',
        email: 'alice.student@test.com',
        password: 'password123',
        accountRole: 'student',
        branch: 'Computer Science',
        college: 'Engineering College',
        yearOfStudy: '3rd Year'
      });
    studentToken = studentRes.body.data.token;
    studentUser = studentRes.body.data.user;
    studentCookie = (studentRes.headers['set-cookie'] || []).find((c) =>
      c.startsWith('skillgraph_rf=')
    );

    // 2. Register employee
    const empRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Employee Bob',
        email: 'bob.engineer@test.com',
        password: 'password123',
        accountRole: 'employee',
        department: 'Engineering'
      });
    employeeToken = empRes.body.data.token;
    employeeUser = empRes.body.data.user;
    employeeCookie = (empRes.headers['set-cookie'] || []).find((c) =>
      c.startsWith('skillgraph_rf=')
    );

    // 3. Register manager
    const mgrRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Manager Carol',
        email: 'carol.manager@test.com',
        password: 'password123',
        accountRole: 'manager',
        department: 'Engineering'
      });
    managerToken = mgrRes.body.data.token;
    managerUser = mgrRes.body.data.user;

    // 4. Register admin
    const admRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Admin Dave',
        email: 'dave.admin@test.com',
        password: 'password123',
        accountRole: 'admin',
        department: 'IT'
      });
    adminToken = admRes.body.data.token;
    adminUser = admRes.body.data.user;
  });

  describe('1. Authentication Core & Credentials', () => {
    it('should register a new student and return access token with HTTP-only cookie', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Fresh Student',
          email: 'fresh@test.com',
          password: 'securepassword123',
          accountRole: 'student',
          college: 'Global Institute'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.accountRole).toBe('student');
      expect(res.body.data.user).not.toHaveProperty('password');

      // Verify HTTP-only refresh token cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const rfCookie = cookies.find((c) => c.startsWith('skillgraph_rf='));
      expect(rfCookie).toBeDefined();
      expect(rfCookie).toContain('HttpOnly');
    });

    it('should reject registration with duplicate email address', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Alice',
          email: 'alice.student@test.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Email already in use');
    });

    it('should authenticate valid credentials and issue tokens and session cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice.student@test.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe('alice.student@test.com');
      expect(res.body.data.user).not.toHaveProperty('password');

      const cookies = res.headers['set-cookie'];
      const rfCookie = cookies.find((c) => c.startsWith('skillgraph_rf='));
      expect(rfCookie).toBeDefined();
      expect(rfCookie).toContain('HttpOnly');
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice.student@test.com',
          password: 'incorrectPassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Incorrect email or password');
    });

    it('should fetch authenticated session details under /me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('alice.student@test.com');
      expect(res.body.data.user.accountRole).toBe('student');
    });

    it('should reject /me request without authorization header', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject /me request with invalid or corrupted token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.corrupted.token');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Dual-Token Refresh & Rotation', () => {
    it('should rotate refresh token and issue new access token via HTTP-only cookie', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', studentCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.email).toBe('alice.student@test.com');

      const newCookie = (res.headers['set-cookie'] || []).find((c) =>
        c.startsWith('skillgraph_rf=')
      );
      expect(newCookie).toBeDefined();
      expect(newCookie).not.toBe(studentCookie);
    });

    it('should detect refresh token reuse and revoke all user sessions as a security mitigation', async () => {
      // First rotation succeeds
      const firstRefresh = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', studentCookie);

      expect(firstRefresh.statusCode).toBe(200);

      // Re-use of the same old studentCookie should trigger reuse detection
      const reuseAttempt = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', studentCookie);

      expect(reuseAttempt.statusCode).toBe(401);
      expect(reuseAttempt.body.error.message).toContain('Token reuse detected');

      // Verify that all active tokens for this user are now revoked in MongoDB
      const activeTokens = await AuthToken.find({
        userId: studentUser._id,
        revoked: false
      });
      expect(activeTokens.length).toBe(0);
    });

    it('should reject refresh without cookie or body token', async () => {
      const res = await request(app).post('/api/auth/refresh');

      expect(res.statusCode).toBe(401);
      expect(res.body.error.message).toContain('Refresh token required');
    });

    it('should revoke token session and clear cookie on logout', async () => {
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', studentCookie);

      expect(logoutRes.statusCode).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Attempting to refresh with logged-out cookie should fail
      const refreshAfterLogout = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', studentCookie);

      expect(refreshAfterLogout.statusCode).toBe(401);
    });
  });

  describe('3. Password Recovery Flow', () => {
    it('should generate password reset token for valid registered email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'alice.student@test.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('reset link has been dispatched');
      expect(res.body).toHaveProperty('resetToken');

      // Check DB contains hashed token and unexpired date
      const userInDb = await User.findOne({ email: 'alice.student@test.com' }).select(
        '+resetPasswordToken +resetPasswordExpires'
      );
      expect(userInDb.resetPasswordToken).toBeDefined();
      expect(userInDb.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return generic success message when requesting reset for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'unknown.user@test.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('reset link has been dispatched');
      expect(res.body).not.toHaveProperty('resetToken');
    });

    it('should reset password successfully with valid reset token and allow login with new password', async () => {
      // 1. Request reset
      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'alice.student@test.com' });
      const resetToken = forgotRes.body.resetToken;

      // 2. Perform reset
      const resetRes = await request(app)
        .post(`/api/auth/reset-password/${resetToken}`)
        .send({ password: 'brandNewPassword123' });

      expect(resetRes.statusCode).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // 3. Old password should fail
      const oldLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice.student@test.com',
          password: 'password123'
        });
      expect(oldLogin.statusCode).toBe(401);

      // 4. New password should succeed
      const newLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice.student@test.com',
          password: 'brandNewPassword123'
        });
      expect(newLogin.statusCode).toBe(200);

      // 5. Token reuse should fail
      const reuseAttempt = await request(app)
        .post(`/api/auth/reset-password/${resetToken}`)
        .send({ password: 'anotherNewPassword123' });
      expect(reuseAttempt.statusCode).toBe(400);
    });

    it('should reject reset attempt with invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password/fakeToken12345')
        .send({ password: 'newPassword123' });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.message).toContain('invalid or has expired');
    });
  });

  describe('4. Role-Based Access Control (RBAC)', () => {
    it('should allow student access to skills catalog and personal skill profile', async () => {
      const skillsRes = await request(app)
        .get('/api/skills')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(skillsRes.statusCode).toBe(200);

      const personalSkillsRes = await request(app)
        .get(`/api/users/${studentUser._id}/skills`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(personalSkillsRes.statusCode).toBe(200);
    });

    it('should block student and employee from accessing manager-only team endpoints', async () => {
      const studentAttempt = await request(app)
        .get('/api/team/skill-analysis')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(studentAttempt.statusCode).toBe(403);
      expect(studentAttempt.body.error.message).toContain('permission');

      const employeeAttempt = await request(app)
        .get('/api/team/skill-analysis')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(employeeAttempt.statusCode).toBe(403);
    });

    it('should allow manager and admin to access team endpoints', async () => {
      const managerAttempt = await request(app)
        .get('/api/team/skill-analysis')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(managerAttempt.statusCode).toBe(200);

      const adminAttempt = await request(app)
        .get('/api/team/skill-analysis')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminAttempt.statusCode).toBe(200);
    });

    it('should block non-admins from deleting user accounts', async () => {
      const studentAttempt = await request(app)
        .delete(`/api/users/${employeeUser._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(studentAttempt.statusCode).toBe(403);

      const managerAttempt = await request(app)
        .delete(`/api/users/${employeeUser._id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(managerAttempt.statusCode).toBe(403);
    });

    it('should allow admin to delete user accounts', async () => {
      const adminAttempt = await request(app)
        .delete(`/api/users/${employeeUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminAttempt.statusCode).toBe(200);
    });
  });
});
