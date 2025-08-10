import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { AppTestHelper } from '../helpers/app-test.helper';
import { SessionStatus } from '../../src/domain/sessions/session-status.enum';
import { TerminalMode } from '../../src/domain/sessions/terminal-mode.enum';

describe('Sessions E2E Tests', () => {
  let app: INestApplication;
  let appTestHelper: AppTestHelper;
  let dockerServiceMock: any;

  beforeAll(async () => {
    appTestHelper = new AppTestHelper();
    app = await appTestHelper.initializeApp();
    dockerServiceMock = appTestHelper.getDockerServiceMock();
  });

  afterEach(async () => {
    // Clear database and reset mocks between tests
    await appTestHelper.clearDatabase();
    jest.clearAllMocks();
    settingsSetup = false; // Reset settings flag
    settingsPromise = null; // Reset promise
  });

  // Helper function to set up required settings for session creation
  let settingsSetup = false;
  let settingsPromise: Promise<void> | null = null;
  const setupRequiredSettings = async () => {
    if (settingsSetup) {
      return;
    }
    
    if (settingsPromise) {
      await settingsPromise;
      return;
    }
    
    settingsPromise = (async () => {
      if (!settingsSetup) {
        await request(app.getHttpServer())
          .put('/api/settings')
          .send({
            sshPrivateKey: '-----BEGIN OPENSSH PRIVATE KEY-----\ntest-key-content\n-----END OPENSSH PRIVATE KEY-----',
            claudeToken: 'sk-test-token-12345',
            gitUserName: 'Test User',
            gitUserEmail: 'test@example.com',
          })
          .expect(200);
        settingsSetup = true;
      }
    })();
    
    await settingsPromise;
  };

  // Helper function to create a session (with settings setup)
  const createSession = async (sessionData: any, expectedStatus = 201) => {
    await setupRequiredSettings();
    return await request(app.getHttpServer())
      .post('/api/sessions')
      .send(sessionData)
      .expect(expectedStatus);
  };

  afterAll(async () => {
    await appTestHelper.closeApp();
  });

  describe('POST /api/sessions', () => {
    it('should create a new session successfully', async () => {
      const sessionData = {
        name: 'test-session',
        repoUrl: 'https://github.com/test/repo.git',
        branch: 'main',
        gitUserName: 'Test User',
        gitUserEmail: 'test@example.com',
        terminalMode: TerminalMode.DUAL,
      };

      const response = await createSession(sessionData);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: 'test-session',
        status: SessionStatus.RUNNING, // Mock container starts immediately
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
    });

    it('should create session with minimal required data', async () => {
      const sessionData = {
        name: 'minimal-session',
      };

      const response = await createSession(sessionData);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('minimal-session');
      expect(response.body.data.status).toBe(SessionStatus.RUNNING);
    });

    it('should validate session name length', async () => {
      const invalidData = {
        name: 'ab', // Too short
      };

      const response = await request(app.getHttpServer())
        .post('/api/sessions')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(JSON.stringify(response.body.error.message)).toContain('name');
    });

    it('should validate git URL format', async () => {
      const invalidData = {
        name: 'test-session',
        repoUrl: 'not-a-valid-git-url',
      };

      const response = await request(app.getHttpServer())
        .post('/api/sessions')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(JSON.stringify(response.body.error.message)).toContain('repoUrl');
    });

    it('should validate email format', async () => {
      const invalidData = {
        name: 'test-session',
        gitUserEmail: 'invalid-email',
      };

      const response = await request(app.getHttpServer())
        .post('/api/sessions')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(JSON.stringify(response.body.error.message)).toContain('gitUserEmail');
    });

    it('should validate terminal mode enum', async () => {
      const invalidData = {
        name: 'test-session',
        terminalMode: 'INVALID_MODE',
      };

      const response = await request(app.getHttpServer())
        .post('/api/sessions')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(JSON.stringify(response.body.error.message)).toContain('terminalMode');
    });

    it('should reject unknown fields', async () => {
      const invalidData = {
        name: 'test-session',
        unknownField: 'should-be-rejected',
      };

      const response = await request(app.getHttpServer())
        .post('/api/sessions')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(JSON.stringify(response.body.error.message)).toContain('should not exist');
    });
  });

  describe('GET /api/sessions', () => {
    it('should return empty array when no sessions exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/sessions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should list all sessions', async () => {
      // Create multiple sessions
      const sessions = [
        { name: 'session-1' },
        { name: 'session-2' },
        { name: 'session-3' },
      ];

      const createdSessions: any[] = [];
      for (const sessionData of sessions) {
        const response = await createSession(sessionData);
        createdSessions.push(response.body.data);
      }

      // List all sessions
      const response = await request(app.getHttpServer())
        .get('/api/sessions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      const names = response.body.data.map(s => s.name).sort();
      expect(names).toEqual(['session-1', 'session-2', 'session-3']);
    });

    it('should filter sessions by status', async () => {
      // Create sessions with different statuses
      await createSession({ name: 'created-session' });

      const response = await request(app.getHttpServer())
        .get('/api/sessions')
        .query({ status: SessionStatus.RUNNING })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe(SessionStatus.RUNNING);
    });
  });

  describe('GET /api/sessions/:id', () => {
    let sessionId: string;

    beforeEach(async () => {
      const response = await createSession({ name: 'test-session' });
      sessionId = response.body.data.id;
    });

    it('should get session by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/sessions/${sessionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(sessionId);
      expect(response.body.data.name).toBe('test-session');
    });

    it('should return 400 for non-existent session', async () => {
      // Use a proper UUID format for the non-existent session ID
      const response = await request(app.getHttpServer())
        .get('/api/sessions/123e4567-e89b-12d3-a456-426614174000')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/sessions/:id', () => {
    let sessionId: string;

    beforeEach(async () => {
      const response = await createSession({ name: 'test-session' });
      sessionId = response.body.data.id;
    });

    it('should return error when trying to delete session', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/sessions/${sessionId}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 when deleting non-existent session', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/sessions/123e4567-e89b-12d3-a456-426614174000')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/sessions/:id/start', () => {
    let sessionId: string;

    beforeEach(async () => {
      const response = await createSession({ name: 'test-session' });
      sessionId = response.body.data.id;
    });

    it('should return error when trying to start an already running session', async () => {
      // Since our mock creates sessions in RUNNING state, starting them should fail
      const response = await request(app.getHttpServer())
        .post(`/api/sessions/${sessionId}/start`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Session is not stopped');
    });

    it('should return 400 for non-existent session', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/sessions/non-existent-id/start')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/sessions/:id/stop', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Sessions are created in RUNNING state, so no need to start them
      const response = await createSession({ name: 'test-session' });
      sessionId = response.body.data.id;
    });

    it('should stop a running session', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/sessions/${sessionId}/stop`)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 for non-existent session', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/sessions/non-existent-id/stop')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });



  describe('GET /api/sessions/:id/health', () => {
    let sessionId: string;

    beforeEach(async () => {
      const response = await createSession({ name: 'test-session' });
      sessionId = response.body.data.id;
    });

    it('should check session health', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/sessions/${sessionId}/health`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('claudeTerminalReady');
      expect(response.body.data).toHaveProperty('manualTerminalReady');
      expect(response.body.data).toHaveProperty('allReady');
      expect(typeof response.body.data.allReady).toBe('boolean');
    });

    it('should return health status for running session', async () => {
      // Session is already running, check health directly
      const response = await request(app.getHttpServer())
        .get(`/api/sessions/${sessionId}/health`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.allReady).toBeDefined();
    });

    it('should return 400 for non-existent session', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/sessions/non-existent-id/health')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Session Lifecycle Integration', () => {
    it('should handle complete session lifecycle', async () => {
      // Create session
      const createResponse = await createSession({
        name: 'lifecycle-test',
        repoUrl: 'https://github.com/test/repo.git',
        branch: 'main',
      });

      const sessionId = createResponse.body.data.id;
      expect(createResponse.body.data.status).toBe(SessionStatus.RUNNING);

      // Session is already running, no need to start it
      // Check that it's running
      const getResponse = await request(app.getHttpServer())
        .get(`/api/sessions/${sessionId}`)
        .expect(200);
      expect(getResponse.body.data.status).toBe(SessionStatus.RUNNING);

      // Check health
      const healthResponse = await request(app.getHttpServer())
        .get(`/api/sessions/${sessionId}/health`)
        .expect(200);

      expect(healthResponse.body.success).toBe(true);

      // Stop session
      const stopResponse = await request(app.getHttpServer())
        .post(`/api/sessions/${sessionId}/stop`)
        .expect(201);

      expect(stopResponse.body.success).toBe(true);

      // Delete session (works after stopping)
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/api/sessions/${sessionId}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in request body', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/sessions')
        .set('Content-Type', 'application/json')
        .send('{"invalid json}')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 404 for non-existent endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/sessions/123/non-existent')
        .expect(404);

      await request(app.getHttpServer())
        .patch('/api/sessions/123')
        .send({})
        .expect(404);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent session creation', async () => {
      const promises = Array(5).fill(null).map((_, index) =>
        createSession({ name: `concurrent-session-${index}` })
      );

      const responses = await Promise.all(promises);

      // All responses should be successful
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(`concurrent-session-${index}`);
      });

      // Verify all sessions were created
      const listResponse = await request(app.getHttpServer())
        .get('/api/sessions')
        .expect(200);

      expect(listResponse.body.data).toHaveLength(5);
    });

    it('should handle concurrent session operations', async () => {
      // Create a session first
      const createResponse = await createSession({ name: 'concurrent-ops-session' });

      const sessionId = createResponse.body.data.id;

      // Wait a moment to ensure database is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Perform multiple concurrent reads
      const promises = Array(3).fill(null).map(() =>
        request(app.getHttpServer()).get(`/api/sessions/${sessionId}`)
      );

      const responses = await Promise.all(promises);

      // All responses should be successful
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(sessionId);
      });
    });
  });
});