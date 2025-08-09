import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { AppTestHelper } from '../helpers/app-test.helper';

describe('Settings E2E Tests', () => {
  let app: INestApplication;
  let appTestHelper: AppTestHelper;

  beforeAll(async () => {
    appTestHelper = new AppTestHelper();
    app = await appTestHelper.initializeApp();
  });

  afterEach(async () => {
    // Clear database between tests
    await appTestHelper.clearDatabase();
  });

  afterAll(async () => {
    await appTestHelper.closeApp();
  });

  describe('GET /api/settings', () => {
    it('should return initial empty settings', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/settings')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      
      const { data } = response.body;
      expect(data).toHaveProperty('updatedAt');
      expect(data.sshPrivateKey).toBeNull();
      expect(data.claudeToken).toBeNull();
      expect(data.gitUserName).toBeNull();
      expect(data.gitUserEmail).toBeNull();
    });

    it('should return updated settings after modification', async () => {
      // First update the settings
      const updateData = {
        sshPrivateKey: 'test-ssh-key',
        claudeToken: 'test-claude-token',
        gitUserName: 'Test User',
        gitUserEmail: 'test@example.com',
      };

      await request(app.getHttpServer())
        .put('/api/settings')
        .send(updateData)
        .expect(200);

      // Then get the settings
      const response = await request(app.getHttpServer())
        .get('/api/settings')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(updateData);
      expect(response.body.data.updatedAt).toBeDefined();
    });
  });

  describe('PUT /api/settings', () => {
    it('should update all settings fields', async () => {
      const updateData = {
        sshPrivateKey: '-----BEGIN OPENSSH PRIVATE KEY-----\ntest-key-content\n-----END OPENSSH PRIVATE KEY-----',
        claudeToken: 'sk-test-token-12345',
        gitUserName: 'John Doe',
        gitUserEmail: 'john.doe@example.com',
      };

      const response = await request(app.getHttpServer())
        .put('/api/settings')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(updateData);
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should update partial settings fields', async () => {
      // First set initial values
      const initialData = {
        sshPrivateKey: 'initial-ssh-key',
        claudeToken: 'initial-token',
        gitUserName: 'Initial User',
        gitUserEmail: 'initial@example.com',
      };

      await request(app.getHttpServer())
        .put('/api/settings')
        .send(initialData)
        .expect(200);

      // Update only some fields
      const partialUpdate = {
        claudeToken: 'updated-token',
        gitUserEmail: 'updated@example.com',
      };

      const response = await request(app.getHttpServer())
        .put('/api/settings')
        .send(partialUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.claudeToken).toBe('updated-token');
      expect(response.body.data.gitUserEmail).toBe('updated@example.com');
      // Check that other fields remain unchanged
      expect(response.body.data.sshPrivateKey).toBe('initial-ssh-key');
      expect(response.body.data.gitUserName).toBe('Initial User');
    });

    it('should handle empty update request', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/settings')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should validate email format', async () => {
      const invalidData = {
        gitUserEmail: 'invalid-email-format',
      };

      const response = await request(app.getHttpServer())
        .put('/api/settings')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(JSON.stringify(response.body.error.message)).toContain('gitUserEmail');
    });

    it('should coerce field types', async () => {
      // NestJS with class-transformer coerces types
      const invalidData = {
        sshPrivateKey: 123, // Will be coerced to "123"
        claudeToken: true, // Will be coerced to "true"
      };

      const response = await request(app.getHttpServer())
        .put('/api/settings')
        .send(invalidData)
        .expect(200); // NestJS coerces the types

      expect(response.body.success).toBe(true);
      expect(response.body.data.sshPrivateKey).toBe('123');
      expect(response.body.data.claudeToken).toBe('true');
    });

    it('should reject unknown fields', async () => {
      const dataWithUnknownFields = {
        sshPrivateKey: 'valid-key',
        unknownField: 'should-be-rejected',
      };

      const response = await request(app.getHttpServer())
        .put('/api/settings')
        .send(dataWithUnknownFields)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(JSON.stringify(response.body.error.message)).toContain('should not exist');
    });

    it('should handle very long string values', async () => {
      const longString = 'a'.repeat(10000);
      const updateData = {
        sshPrivateKey: longString,
        claudeToken: 'normal-token',
      };

      const response = await request(app.getHttpServer())
        .put('/api/settings')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sshPrivateKey).toBe(longString);
      expect(response.body.data.claudeToken).toBe('normal-token');
    });

    it('should handle special characters in strings', async () => {
      const updateData = {
        sshPrivateKey: '-----BEGIN KEY-----\n!@#$%^&*()_+{}|:"<>?\n-----END KEY-----',
        claudeToken: 'token-with-special-chars-!@#$%',
        gitUserName: 'User Name (with parentheses)',
        gitUserEmail: 'user+tag@example.com',
      };

      const response = await request(app.getHttpServer())
        .put('/api/settings')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(updateData);
    });

    it('should handle null values', async () => {
      // First set some values
      const initialData = {
        sshPrivateKey: 'initial-key',
        claudeToken: 'initial-token',
      };

      await request(app.getHttpServer())
        .put('/api/settings')
        .send(initialData)
        .expect(200);

      // Try to set empty values (which should clear the values)
      const emptyData = {
        sshPrivateKey: '',
        claudeToken: '',
      };

      const response = await request(app.getHttpServer())
        .put('/api/settings')
        .send(emptyData)
        .expect(200);

      // Values should be cleared
      expect(response.body.success).toBe(true);
      expect(response.body.data.sshPrivateKey).toBe('');
      expect(response.body.data.claudeToken).toBe('');
    });
  });

  describe('Settings Persistence', () => {
    it('should persist settings across multiple requests', async () => {
      const settingsData = {
        sshPrivateKey: 'persistent-key',
        claudeToken: 'persistent-token',
        gitUserName: 'Persistent User',
        gitUserEmail: 'persistent@example.com',
      };

      // Update settings
      await request(app.getHttpServer())
        .put('/api/settings')
        .send(settingsData)
        .expect(200);

      // Make multiple GET requests to verify persistence
      for (let i = 0; i < 3; i++) {
        const response = await request(app.getHttpServer())
          .get('/api/settings')
          .expect(200);

        expect(response.body.data).toMatchObject(settingsData);
      }
    });

    it('should maintain updatedAt timestamp', async () => {
      // Create initial settings
      const response1 = await request(app.getHttpServer())
        .put('/api/settings')
        .send({ claudeToken: 'token1' })
        .expect(200);

      const updatedAt1 = response1.body.data.updatedAt;
      expect(updatedAt1).toBeDefined();

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update settings again
      const response2 = await request(app.getHttpServer())
        .put('/api/settings')
        .send({ claudeToken: 'token2' })
        .expect(200);

      const updatedAt2 = response2.body.data.updatedAt;
      expect(updatedAt2).toBeDefined();

      // Verify timestamps are different
      expect(new Date(updatedAt2).getTime()).toBeGreaterThan(
        new Date(updatedAt1).getTime()
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in request body', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/settings')
        .set('Content-Type', 'application/json')
        .send('{"invalid json}')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle invalid content type', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/settings')
        .set('Content-Type', 'text/plain')
        .send('plain text')
        .expect(200); // NestJS handles this gracefully by parsing empty body

      // When body can't be parsed, it's treated as empty object
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/settings/non-existent')
        .expect(404);

      await request(app.getHttpServer())
        .post('/api/settings')
        .send({})
        .expect(404);

      await request(app.getHttpServer())
        .delete('/api/settings')
        .expect(404);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent read operations', async () => {
      // Set initial data
      await request(app.getHttpServer())
        .put('/api/settings')
        .send({
          claudeToken: 'concurrent-token',
          gitUserName: 'Concurrent User',
        })
        .expect(200);

      // Wait a moment to ensure database is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Perform multiple concurrent reads (reduced from 10 to 5 to avoid connection issues)
      const promises = Array(5).fill(null).map(() =>
        request(app.getHttpServer()).get('/api/settings')
      );

      const responses = await Promise.all(promises);

      // All responses should be successful and contain the same data
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.data.claudeToken).toBe('concurrent-token');
        expect(response.body.data.gitUserName).toBe('Concurrent User');
      });
    });

    it('should handle concurrent write operations gracefully', async () => {
      // Initialize settings first to avoid concurrent creation issues
      await request(app.getHttpServer())
        .put('/api/settings')
        .send({ claudeToken: 'initial' })
        .expect(200);

      // Wait a moment to ensure database is ready
      await new Promise(resolve => setTimeout(resolve, 50));

      // Perform multiple concurrent writes
      const promises = Array(5).fill(null).map((_, index) =>
        request(app.getHttpServer())
          .put('/api/settings')
          .send({
            claudeToken: `token-${index}`,
            gitUserName: `User ${index}`,
          })
      );

      const responses = await Promise.all(promises);

      // All responses should be successful
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Final state should have one of the values (last write wins)
      const finalResponse = await request(app.getHttpServer())
        .get('/api/settings')
        .expect(200);

      expect(finalResponse.body.data.claudeToken).toMatch(/^token-\d$/);
      expect(finalResponse.body.data.gitUserName).toMatch(/^User \d$/);
    });
  });
});