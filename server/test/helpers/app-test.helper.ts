import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {DataSource} from 'typeorm';
import {ApplicationFactory} from '../../src/libs/app-factory/application.factory';
import {Session} from '../../src/domain/sessions/session.entity';
import {Settings} from '../../src/domain/settings/settings.entity';
import {DockerEngineService} from '../../src/services/docker/docker-engine.service';
import {PortManagerService} from '../../src/services/docker/port-manager.service';
import {AppConfig} from '../../src/libs/config/app.config';
import {dotenvLoader, TypedConfigModule} from 'nest-typed-config';
import {ResponseService} from '../../src/libs/response/response.service';
import {HttpExceptionFilter} from '../../src/libs/common/filters/http-exception.filter';
import {SessionsModule} from '../../src/interactors/sessions/sessions.module';
import {SettingsModule} from '../../src/interactors/settings/settings.module';
import {GatewaysModule} from '../../src/gateways/gateways.module';
import {HealthModule} from '../../src/health/health.module';

/**
 * Helper class for E2E tests to set up the application with real dependencies
 */
export class AppTestHelper {
  private app: INestApplication | null = null;
  private moduleFixture: TestingModule | null = null;
  private dataSource: DataSource | null = null;

  /**
   * Initializes the application for E2E testing with an in-memory SQLite database
   */
  async initializeApp(): Promise<INestApplication> {
    if (this.app) {
      return this.app;
    }

    // Create test data source with in-memory database
    this.dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [Session, Settings],
      synchronize: true,
      dropSchema: true,
      logging: false,
    });

    await this.dataSource.initialize();

    // Create a testing module with test-specific configuration
    this.moduleFixture = await Test.createTestingModule({
      imports: [
        TypedConfigModule.forRoot({
          schema: AppConfig,
          load: dotenvLoader({
            separator: '_',
          }),
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Session, Settings],
          synchronize: true,
          dropSchema: false,
          logging: false,
        }),
        SessionsModule,
        SettingsModule,
        GatewaysModule,
        HealthModule,
      ],
      providers: [ResponseService, HttpExceptionFilter],
    })
      // Mock Docker service for E2E tests
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
          State: { Running: true },
          NetworkSettings: {
            Ports: {
              '7681/tcp': [{ HostPort: '8080' }],
            },
          },
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
      // Mock Port Manager service
      .overrideProvider(PortManagerService)
      .useValue({
        allocatePort: jest.fn().mockResolvedValue(8080),
        releasePort: jest.fn().mockResolvedValue(undefined),
        isPortAvailable: jest.fn().mockResolvedValue(true),
        getRandomPort: jest.fn().mockReturnValue(8080),
      })
      // Override AppConfig for testing
      .overrideProvider(AppConfig)
      .useValue({
        port: 3001,
        nodeEnv: 'test',
        dockerHost: 'unix:///var/run/docker.sock',
        defaultTerminalImage: 'afk-terminal:latest',
        defaultSshPort: 22,
        defaultHttpPort: 7681,
        defaultTerminalHost: 'localhost',
        defaultTerminalScheme: 'http',
        defaultWorkingDirectory: '/workspace',
      })
      .compile();

    this.app = this.moduleFixture.createNestApplication();

    // Configure the application with the same setup as production
    ApplicationFactory.configure(this.app);

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
    return this.app.get(DockerEngineService) as jest.Mocked<DockerEngineService>;
  }

  /**
   * Gets the Port Manager service mock for test assertions
   */
  getPortManagerMock(): jest.Mocked<PortManagerService> {
    if (!this.app) {
      throw new Error('App not initialized yet');
    }
    return this.app.get(PortManagerService) as jest.Mocked<PortManagerService>;
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
      const entities = dataSource.entityMetadatas;

      // Clear all tables
      for (const entity of entities) {
        const repository = dataSource.getRepository(entity.name);
        await repository.clear();
      }
    } catch (error) {
      // If there's an error clearing the database, it might be because
      // the tables don't exist yet, which is fine for the first test
      console.log('Note: Could not clear database, might be first test run');
    }
  }

  /**
   * Closes the application and cleans up resources
   */
  async closeApp(): Promise<void> {
    if (this.dataSource) {
      await this.dataSource.destroy();
      this.dataSource = null;
    }

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