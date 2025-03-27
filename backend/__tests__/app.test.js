
const request = require('supertest');
const app = require('../app');
const nock = require('nock');

// Mock Supabase API responses
jest.mock('node-fetch', () => jest.fn());

describe('Backend API Tests', () => {
  beforeAll(() => {
    // Set up nock to intercept Supabase API calls
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });

  afterAll(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Indent API Endpoints', () => {
    it('GET /api/indents should return list of indents', async () => {
      const mockIndents = [
        { 
          id: 'indent-1', 
          customer_id: 'customer-1',
          vehicle_id: 'vehicle-1',
          fuel_type: 'Petrol',
          amount: 1000,
          quantity: 10,
          status: 'Pending'
        }
      ];

      // Mock Supabase response
      nock(process.env.SUPABASE_URL || 'https://svuritdhlgaonfefphkz.supabase.co')
        .get('/rest/v1/indents')
        .reply(200, mockIndents);

      const response = await request(app).get('/api/indents');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockIndents);
    });

    it('POST /api/indents should create a new indent', async () => {
      const newIndent = {
        customer_id: 'customer-1',
        vehicle_id: 'vehicle-1',
        fuel_type: 'Petrol',
        amount: 1000,
        quantity: 10
      };

      const mockResponse = [
        { 
          id: 'indent-1', 
          ...newIndent,
          status: 'Pending'
        }
      ];

      // Mock Supabase response
      nock(process.env.SUPABASE_URL || 'https://svuritdhlgaonfefphkz.supabase.co')
        .post('/rest/v1/indents')
        .reply(201, mockResponse);

      const response = await request(app)
        .post('/api/indents')
        .send(newIndent);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, indent: mockResponse[0] });
    });
  });

  describe('Transaction API Endpoints', () => {
    it('GET /api/transactions should return list of transactions', async () => {
      const mockTransactions = [
        { 
          id: 'trx-1', 
          customer_id: 'customer-1',
          vehicle_id: 'vehicle-1',
          fuel_type: 'Petrol',
          amount: 1000,
          quantity: 10,
          date: '2023-08-15',
          payment_method: 'Cash'
        }
      ];

      // Mock Supabase response
      nock(process.env.SUPABASE_URL || 'https://svuritdhlgaonfefphkz.supabase.co')
        .get('/rest/v1/transactions')
        .reply(200, mockTransactions);

      const response = await request(app).get('/api/transactions');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTransactions);
    });

    it('POST /api/transactions should create a new transaction', async () => {
      const newTransaction = {
        customer_id: 'customer-1',
        vehicle_id: 'vehicle-1',
        fuel_type: 'Petrol',
        amount: 1000,
        quantity: 10,
        payment_method: 'Cash',
        staff_id: 'staff-1'
      };

      const mockResponse = [
        { 
          id: 'trx-1', 
          ...newTransaction,
          date: '2023-08-15'
        }
      ];

      // Mock Supabase response
      nock(process.env.SUPABASE_URL || 'https://svuritdhlgaonfefphkz.supabase.co')
        .post('/rest/v1/transactions')
        .reply(201, mockResponse);

      const response = await request(app)
        .post('/api/transactions')
        .send(newTransaction);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, transaction: mockResponse[0] });
    });
  });

  describe('Customer and Vehicle Endpoints', () => {
    it('GET /api/customers should return list of customers', async () => {
      const mockCustomers = [
        { 
          id: 'customer-1', 
          name: 'Test Customer', 
          contact: 'Test Contact',
          phone: '1234567890',
          email: 'test@example.com',
          gst: 'GST123'
        }
      ];

      // Mock Supabase response
      nock(process.env.SUPABASE_URL || 'https://svuritdhlgaonfefphkz.supabase.co')
        .get('/rest/v1/customers')
        .reply(200, mockCustomers);

      const response = await request(app).get('/api/customers');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCustomers);
    });

    it('GET /api/vehicles should return vehicles for a customer', async () => {
      const mockVehicles = [
        { 
          id: 'vehicle-1', 
          customer_id: 'customer-1',
          number: 'ABC123',
          type: 'Car',
          capacity: '100L'
        }
      ];

      // Mock Supabase response
      nock(process.env.SUPABASE_URL || 'https://svuritdhlgaonfefphkz.supabase.co')
        .get('/rest/v1/vehicles')
        .query({ customer_id: 'eq.customer-1' })
        .reply(200, mockVehicles);

      const response = await request(app)
        .get('/api/vehicles')
        .query({ customer_id: 'customer-1' });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVehicles);
    });
  });
});
