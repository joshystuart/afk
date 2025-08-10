import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { AppModule } from '../../src/app.module';
import { ApplicationFactory } from '../../src/libs/app-factory/application.factory';
import { DockerEngineService } from '../../src/services/docker/docker-engine.service';
import { PortManagerService } from '../../src/services/docker/port-manager.service';
import { AppConfig } from '../../src/libs/config/app.config';

/**
 * Helper class for E2E tests to set up the application with real dependencies
 */
export class AppTestHelper {
  private app: INestApplication | null = null;
  private moduleFixture: TestingModule | null = null;

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
    const testDbName = `:memory:?cache=shared&mode=memory&_busy_timeout=30000`;
    process.env.DB_DATABASE = testDbName;

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
        startContainer: jest.fn().mockResolvedValue(undefined),
        stopContainer: jest.fn().mockResolvedValue(undefined),
        removeContainer: jest.fn().mockResolvedValue(undefined),
        getContainerInfo: jest.fn().mockResolvedValue({
          id: 'test-container-id',
          name: 'test-container',
          state: 'running',
          created: new Date(),
          ports: [{ host: 8080, container: 7681, protocol: 'tcp' }],
          labels: {},
        }),
        execCommand: jest.fn().mockResolvedValue({
          stdout: 'command output',
          stderr: '',
        }),
        pullImage: jest.fn().mockResolvedValue(undefined),
        listContainers: jest.fn().mockResolvedValue([]),
        createNetwork: jest.fn().mockResolvedValue({ id: 'test-network-id' }),
        removeNetwork: jest.fn().mockResolvedValue(undefined),
      })
      // Mock Port Manager service (external dependency)
      .overrideProvider(PortManagerService)
      .useValue({
        allocatePort: jest.fn().mockResolvedValue(8080),
        releasePort: jest.fn().mockResolvedValue(undefined),
        isPortAvailable: jest.fn().mockResolvedValue(true),
        getRandomPort: jest.fn().mockReturnValue(8080),
        allocatePortPair: jest.fn().mockResolvedValue({
          claudePort: 8080,
          manualPort: 8081,
          toJSON: () => ({ claude: 8080, manual: 8081 }),
        }),
        releasePortPair: jest.fn().mockResolvedValue(undefined),
      })
      // Override AppConfig for testing (but keep most settings the same)
      .overrideProvider(AppConfig)
      .useValue({
        port: 3001,
        nodeEnv: 'test',
        defaultWorkingDirectory: '/workspace',
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
   * Gets the application instance
   */
  getApp(): INestApplication {
    if (!this.app) {
      throw new Error('App not initialized yet');
    }
    return this.app;
  }
}
