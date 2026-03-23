import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { join } from 'path';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from '../../src/app.module';
import { ApplicationFactory } from '../../src/libs/app-factory/application.factory';
import { DockerEngineService } from '../../src/libs/docker/docker-engine.service';
import { PortManagerService } from '../../src/libs/docker/port-manager.service';
import { AppConfig } from '../../src/libs/config/app.config';
import { DockerImageRepository } from '../../src/domain/docker-images/docker-image.repository';
import { DockerImage } from '../../src/domain/docker-images/docker-image.entity';
import { DockerImageStatus } from '../../src/domain/docker-images/docker-image-status.enum';
import { SETTINGS_REPOSITORY } from '../../src/domain/settings/settings.tokens';
import { SettingsRepositoryImpl } from '../../src/libs/settings/settings.repository';

const TEST_ADMIN_USER = {
  username: 'admin',
  password: 'admin123',
};

/**
 * Helper class for E2E tests to set up the application with real dependencies
 */
export class AppTestHelper {
  private app: INestApplication | null = null;
  private moduleFixture: TestingModule | null = null;
  private authToken: string | null = null;

  /**
   * Initializes the application for E2E testing with an in-memory SQLite database
   */
  async initializeApp(): Promise<INestApplication> {
    if (this.app) {
      return this.app;
    }

    // Set environment variables for testing
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_TYPE = 'sqlite';

    // Use a unique in-memory database for each test helper instance
    const testDbName = `:memory:`;
    process.env.DB_SQLITE_DATABASE = testDbName;

    // Create a testing module using the actual AppModule with test config
    const testConfigPath =
      process.env.NODE_ENV === 'test'
        ? join(__dirname, '../../src/config')
        : undefined;
    const moduleMetadata = AppModule.forRoot({ configPath: testConfigPath });
    this.moduleFixture = await Test.createTestingModule({
      imports: moduleMetadata.imports,
      controllers: moduleMetadata.controllers,
      providers: moduleMetadata.providers,
    })
      // Mock Docker service for E2E tests (external dependency)
      .overrideProvider(DockerEngineService)
      .useValue({
        createContainer: jest.fn().mockResolvedValue({
          id: 'test-container-id',
          name: 'test-container',
          state: 'running',
        }),
        waitForContainerReady: jest.fn().mockResolvedValue(undefined),
        isContainerReady: jest.fn().mockResolvedValue(true),
        startContainer: jest.fn().mockResolvedValue(undefined),
        stopContainer: jest.fn().mockResolvedValue(undefined),
        removeContainer: jest.fn().mockResolvedValue(undefined),
        removeSessionVolumes: jest.fn().mockResolvedValue(undefined),
        getContainerInfo: jest.fn().mockResolvedValue({
          id: 'test-container-id',
          name: 'test-container',
          state: 'running',
          health: 'healthy',
          created: new Date(),
          ports: { '8080/tcp': 8080 },
          labels: {},
        }),
        execInContainer: jest.fn().mockResolvedValue({
          stdout: 'command output',
          stderr: '',
          exitCode: 0,
        }),
        execStreamInContainer: jest.fn().mockResolvedValue({
          stream: {
            on: jest.fn(),
            destroy: jest.fn(),
          },
          kill: jest.fn().mockResolvedValue(undefined),
        }),
        listAFKContainers: jest.fn().mockResolvedValue([]),
        openContainerFollowLogStream: jest.fn().mockResolvedValue({
          on: jest.fn(),
          destroy: jest.fn(),
        }),
        ping: jest.fn().mockResolvedValue(undefined),
        waitForDockerReady: jest.fn().mockResolvedValue(undefined),
      })
      // Mock Port Manager service (external dependency)
      .overrideProvider(PortManagerService)
      .useValue({
        allocatePortPair: jest.fn().mockResolvedValue({
          port: 8080,
          terminalPort: 7681,
          toJSON: () => ({ port: 8080, terminalPort: 7681 }),
        }),
        releasePortPair: jest.fn().mockResolvedValue(undefined),
        getAvailablePortCount: jest.fn().mockResolvedValue(100),
        isPortAvailable: jest.fn().mockResolvedValue(true),
      })
      // Override AppConfig for testing (but keep most settings the same)
      .overrideProvider(AppConfig)
      .useValue({
        port: 4919,
        nodeEnv: 'test',
        baseUrl: 'http://localhost',
        defaultWorkingDirectory: '/workspace',
        adminUser: TEST_ADMIN_USER,
      })
      .compile();

    this.app = this.moduleFixture.createNestApplication();

    // Use the same application configuration as production, but optimized for testing
    ApplicationFactory.configureForTesting(this.app);

    await this.app.init();

    return this.app;
  }

  /**
   * Gets the Docker service mock for test assertions
   */
  getDockerServiceMock(): jest.Mocked<DockerEngineService> {
    if (!this.app) {
      throw new Error('App not initialized yet');
    }
    return this.app.get(DockerEngineService);
  }

  /**
   * Gets the Port Manager service mock for test assertions
   */
  getPortManagerMock(): jest.Mocked<PortManagerService> {
    if (!this.app) {
      throw new Error('App not initialized yet');
    }
    return this.app.get(PortManagerService);
  }

  /**
   * Clears all data from the test database
   */
  async clearDatabase(): Promise<void> {
    if (!this.moduleFixture) {
      throw new Error('App not initialized yet');
    }

    try {
      // Get the DataSource from the module
      const dataSource = this.moduleFixture.get(DataSource);

      // For in-memory SQLite, we can just drop and recreate the schema
      await dataSource.dropDatabase();
      await dataSource.synchronize();
    } catch (error) {
      // If there's an error clearing the database, try the fallback approach
      console.log('Using fallback database clear approach:', error.message);

      try {
        const dataSource = this.moduleFixture.get(DataSource);
        const entities = dataSource.entityMetadatas;

        // Clear all tables
        for (const entity of entities) {
          const repository = dataSource.getRepository(entity.name);
          await repository.clear();
        }
      } catch (fallbackError) {
        console.log('Note: Could not clear database, might be first test run');
      }
    }

    await this.seedDefaults();
  }

  /**
   * Re-seeds default data that would normally be created by onModuleInit hooks.
   * Must be called after clearDatabase() since dropping the schema wipes seeded rows.
   */
  private async seedDefaults(): Promise<void> {
    const settingsRepo =
      this.moduleFixture!.get<SettingsRepositoryImpl>(SETTINGS_REPOSITORY);
    await settingsRepo.onModuleInit();
  }

  /**
   * Closes the application and cleans up resources
   */
  async closeApp(): Promise<void> {
    if (this.app) {
      await this.app.close();
      this.app = null;
      this.moduleFixture = null;
    }
  }

  /**
   * Logs in with the test admin credentials and caches the auth token
   */
  async login(): Promise<string> {
    if (!this.app) {
      throw new Error('App not initialized yet');
    }

    const response = await request(this.app.getHttpServer())
      .post('/api/auth/login')
      .send(TEST_ADMIN_USER)
      .expect(200);

    this.authToken = response.body.data?.token ?? response.body.token;
    return this.authToken!;
  }

  /**
   * Returns a cached auth token, logging in if needed
   */
  async getAuthToken(): Promise<string> {
    if (this.authToken) {
      return this.authToken;
    }
    return this.login();
  }

  /**
   * Seeds a test docker image into the database and returns its ID.
   * Useful after clearDatabase() wipes seeded images.
   */
  async seedTestDockerImage(): Promise<string> {
    if (!this.moduleFixture) {
      throw new Error('App not initialized yet');
    }

    const repo = this.moduleFixture.get(DockerImageRepository);
    const id = uuidv4();
    const image = new DockerImage({
      id,
      name: 'Test Image',
      image: 'afk-test:latest',
      isDefault: true,
      isBuiltIn: true,
      status: DockerImageStatus.AVAILABLE,
      errorMessage: null,
    });
    await repo.save(image);
    return id;
  }

  /**
   * Gets the application instance
   */
  getApp(): INestApplication {
    if (!this.app) {
      throw new Error('App not initialized yet');
    }
    return this.app;
  }
}
