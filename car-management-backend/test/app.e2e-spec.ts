import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { disconnect } from 'mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User, UserSchema } from '../src/auth/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { CarStatus } from '../src/car/schemas/car.schema';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { CanActivate } from '@nestjs/common';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let adminToken: string;
  let adminUser: any;
  let carId: string;

  const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }), // For ConfigService
        MongooseModule.forRoot(mongoUri), // Connect to in-memory MongoDB
        AppModule,
      ],
    })
      // Override JwtAuthGuard to allow unauthenticated access for specific tests
      // and mock authenticated access where needed
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create an admin user for testing authenticated routes
    const userModel = app.get('UserModel') as typeof User; // Get the Mongoose Model
    const hashedPassword = await bcrypt.hash('password123', 10);
    adminUser = await new userModel({
      email: 'admin@test.com',
      password: hashedPassword,
      isAdmin: true,
    }).save();

    // Get a JWT token for the admin user
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' })
      .expect(200);
    adminToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await disconnect(); // Disconnect Mongoose
    if (mongod) {
      await mongod.stop(); // Stop the in-memory MongoDB server
    }
    await app.close();
  });

  it('/ (GET) - Public endpoint without auth', () => {
    (mockGuard.canActivate as jest.Mock).mockReturnValue(true); // Ensure guard passes for public
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!'); // This is the default from app.controller.ts
  });

  describe('Authentication', () => {
    it('should allow admin to login and get a token', async () => {
      // already done in beforeAll, just verify the token exists
      expect(adminToken).toBeDefined();
    });

    it('should prevent access to protected routes without a token', async () => {
      (mockGuard.canActivate as jest.Mock).mockReturnValue(false); // Ensure guard blocks
      await request(app.getHttpServer()).get('/cars').expect(401);
    });

    it('should allow access to protected routes with a valid token', async () => {
      (mockGuard.canActivate as jest.Mock).mockReturnValue(true); // Ensure guard passes
      await request(app.getHttpServer()).get('/cars').set('Authorization', `Bearer ${adminToken}`).expect(200);
    });
  });

  describe('Car CRUD', () => {
    it('should create a car', async () => {
      (mockGuard.canActivate as jest.Mock).mockReturnValue(true); // Ensure guard passes
      const createCarDto = {
        brand: 'TestBrand',
        model: 'TestModel',
        year: 2023,
        specifications: ['Auto', 'Petrol'],
        totalKilometers: 1000,
        status: CarStatus.AVAILABLE,
        lastMaintenanceDate: new Date().toISOString(),
      };
      const response = await request(app.getHttpServer())
        .post('/cars')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createCarDto)
        .expect(201);
      expect(response.body).toMatchObject({
        brand: 'TestBrand',
        model: 'TestModel',
        year: 2023,
      });
      carId = response.body._id; // Save carId for other tests
    });

    it('should get all cars (authenticated)', async () => {
      (mockGuard.canActivate as jest.Mock).mockReturnValue(true); // Ensure guard passes
      const response = await request(app.getHttpServer())
        .get('/cars')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0]).toHaveProperty('_id');
    });

    it('should get a single car by ID', async () => {
      (mockGuard.canActivate as jest.Mock).mockReturnValue(true); // Ensure guard passes
      await request(app.getHttpServer())
        .get(`/cars/${carId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(carId);
          expect(res.body.brand).toBe('TestBrand');
        });
    });

    it('should update a car', async () => {
      (mockGuard.canActivate as jest.Mock).mockReturnValue(true); // Ensure guard passes
      const updateCarDto = { model: 'UpdatedModel', totalKilometers: 1500 };
      const response = await request(app.getHttpServer())
        .put(`/cars/${carId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateCarDto)
        .expect(200);
      expect(response.body.model).toBe('UpdatedModel');
      expect(response.body.totalKilometers).toBe(1500);
      // Ensure kilometersSinceLastMaintenance is updated correctly
      expect(response.body.kilometersSinceLastMaintenance).toBe(500);
    });

    it('should delete a car', async () => {
      (mockGuard.canActivate as jest.Mock).mockReturnValue(true); // Ensure guard passes
      await request(app.getHttpServer())
        .delete(`/cars/${carId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
      // Verify it's deleted
      await request(app.getHttpServer())
        .get(`/cars/${carId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Car Status Management', () => {
    let statusCarId: string;
    beforeAll(async () => {
      (mockGuard.canActivate as jest.Mock).mockReturnValue(true); // Ensure guard passes
      const createCarDto = {
        brand: 'StatusTest',
        model: 'StatusModel',
        year: 2020,
        specifications: [],
        totalKilometers: 1000,
        status: CarStatus.AVAILABLE,
        lastMaintenanceDate: new Date().toISOString(),
      };
      const response = await request(app.getHttpServer())
        .post('/cars')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createCarDto)
        .expect(201);
      statusCarId = response.body._id;
    });

    it('should change car status to MAINTENANCE', async () => {
      (mockGuard.canActivate as jest.Mock).mockReturnValue(true); // Ensure guard passes
      await request(app.getHttpServer())
        .put(`/cars/${statusCarId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: CarStatus.MAINTENANCE })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(CarStatus.MAINTENANCE);
        });
    });

    it('should change car status to AVAILABLE and reset maintenance data', async () => {
      (mockGuard.canActivate as jest.Mock).mockReturnValue(true); // Ensure guard passes
      // First, update to increase kilometersSinceLastMaintenance
      await request(app.getHttpServer())
        .put(`/cars/${statusCarId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ totalKilometers: 11000 })
        .expect(200);

      const carBeforeStatusChange = await request(app.getHttpServer())
        .get(`/cars/${statusCarId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(carBeforeStatusChange.body.kilometersSinceLastMaintenance).toBeGreaterThan(0);

      await request(app.getHttpServer())
        .put(`/cars/${statusCarId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: CarStatus.AVAILABLE })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(CarStatus.AVAILABLE);
          expect(res.body.kilometersSinceLastMaintenance).toBe(0);
          expect(new Date(res.body.lastMaintenanceDate).toDateString()).toBe(new Date().toDateString());
        });
    });
  });

  describe('Car Details (Reports & Activity Logs)', () => {
    let detailsCarId: string;
    beforeAll(async () => {
      (mockGuard.canActivate as jest.Mock).mockReturnValue(true); // Ensure guard passes
      const createCarDto = {
        brand: 'DetailsTest',
        model: 'DetailsModel',
        year: 2022,
        specifications: [],
        totalKilometers: 500,
        status: CarStatus.AVAILABLE,
        lastMaintenanceDate: new Date().toISOString(),
      };
      const response = await request(app.getHttpServer())
        .post('/cars')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createCarDto)
        .expect(201);
      detailsCarId = response.body._id;
    });

    it('should add a report to a car', async () => {
      (mockGuard.canActivate as jest.Mock).mockReturnValue(true); // Ensure guard passes
      const createReportDto = { description: 'Engine check needed', severity: 'HIGH' };
      const response = await request(app.getHttpServer())
        .post(`/cars/${detailsCarId}/reports`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createReportDto)
        .expect(201);
      expect(response.body).toMatchObject({
        description: 'Engine check needed',
        severity: 'HIGH',
        car: detailsCarId,
      });
    });

    it('should get reports for a car', async () => {
      (mockGuard.canActivate as jest.Mock).mockReturnValue(true); // Ensure guard passes
      const response = await request(app.getHttpServer())
        .get(`/cars/${detailsCarId}/reports`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0]).toHaveProperty('_id');
      expect(response.body[0].description).toBe('Engine check needed');
    });

    it('should get activity logs for a car', async () => {
      (mockGuard.canActivate as jest.Mock).mockReturnValue(true); // Ensure guard passes
      const response = await request(app.getHttpServer())
        .get(`/cars/${detailsCarId}/activity-logs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body.length).toBeGreaterThanOrEqual(1); // Should have at least 'CAR_CREATED'
      expect(response.body[0]).toHaveProperty('_id');
    });
  });

  describe('Car Tracking', () => {
    let trackingCarId: string;
    beforeAll(async () => {
      (mockGuard.canActivate as jest.Mock).mockReturnValue(true); // Ensure guard passes
      const createCarDto = {
        brand: 'TrackingTest',
        model: 'TrackingModel',
        year: 2023,
        specifications: [],
        totalKilometers: 100,
        status: CarStatus.RESERVED, // Must be reserved for tracking
        lastMaintenanceDate: new Date().toISOString(),
      };
      const response = await request(app.getHttpServer())
        .post('/cars')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createCarDto)
        .expect(201);
      trackingCarId = response.body._id;
    });

    it('should simulate location update for a reserved car', async () => {
      (mockGuard.canActivate as jest.Mock).mockReturnValue(true); // Ensure guard passes
      const response = await request(app.getHttpServer())
        .put(`/cars/${trackingCarId}/simulate-location`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body.currentLocation).toBeDefined();
      expect(response.body.currentLocation.latitude).toBeDefined();
      expect(response.body.currentLocation.longitude).toBeDefined();
    });

    it('should not simulate location update for a non-reserved car', async () => {
      (mockGuard.canActivate as jest.Mock).mockReturnValue(true); // Ensure guard passes
      // Change status to AVAILABLE
      await request(app.getHttpServer())
        .put(`/cars/${trackingCarId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: CarStatus.AVAILABLE })
        .expect(200);

      // Attempt to simulate location
      await request(app.getHttpServer())
        .put(`/cars/${trackingCarId}/simulate-location`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400); // Expect bad request
    });
  });

  describe('Dashboard Statistics', () => {
    let statsCar1: string, statsCar2: string, statsCar3: string, statsCar4: string;

    beforeAll(async () => {
      (mockGuard.canActivate as jest.Mock).mockReturnValue(true); // Ensure guard passes
      // Clear existing cars
      await request(app.getHttpServer()).delete(`/cars/${carId}`).set('Authorization', `Bearer ${adminToken}`);

      // Create some cars for stats
      const carData = [
        { brand: 'StatCar1', model: 'A', year: 2020, specifications: [], totalKilometers: 5000, status: CarStatus.AVAILABLE, lastMaintenanceDate: new Date().toISOString() },
        { brand: 'StatCar2', model: 'B', year: 2021, specifications: [], totalKilometers: 8000, status: CarStatus.RESERVED, lastMaintenanceDate: new Date().toISOString() },
        { brand: 'StatCar3', model: 'C', year: 2022, specifications: [], totalKilometers: 15000, status: CarStatus.MAINTENANCE, lastMaintenanceDate: new Date().toISOString() },
        { brand: 'StatCar4', model: 'D', year: 2023, specifications: [], totalKilometers: 12000, status: CarStatus.AVAILABLE, lastMaintenanceDate: new Date().toISOString() }, // Needs maintenance soon
      ];
      const responses = await Promise.all(carData.map(data =>
        request(app.getHttpServer()).post('/cars').set('Authorization', `Bearer ${adminToken}`).send(data)
      ));
      statsCar1 = responses[0].body._id;
      statsCar2 = responses[1].body._id;
      statsCar3 = responses[2].body._id;
      statsCar4 = responses[3].body._id;
    });

    it('should return correct dashboard statistics', async () => {
      (mockGuard.canActivate as jest.Mock).mockReturnValue(true); // Ensure guard passes
      const response = await request(app.getHttpServer())
        .get('/cars/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.totalCars).toBe(4);
      expect(response.body.availableCars).toBe(2); // StatCar1, StatCar4
      expect(response.body.reservedCars).toBe(1); // StatCar2
      expect(response.body.maintenanceCars).toBe(1); // StatCar3
      expect(response.body.needsMaintenanceSoon).toBe(1); // StatCar4 (AVAILABLE but >= 10000km)
    });
  });

  describe('Public Car Listing', () => {
    it('should return only available cars without authentication', async () => {
      (mockGuard.canActivate as jest.Mock).mockReturnValue(false); // Guard should not activate
      const response = await request(app.getHttpServer()).get('/cars').expect(200);

      expect(response.body.every((car: any) => car.status === CarStatus.AVAILABLE)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1); // Should contain at least StatCar1, StatCar4
    });
  });
});