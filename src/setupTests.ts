
// Mock fetch API globally for all tests
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  })
) as jest.Mock;

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
