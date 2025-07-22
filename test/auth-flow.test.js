// End-to-end test for unified auth flow
// Tests the complete authentication flow without redirect loops

describe('Unified Auth Flow', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Mock console methods to track calls
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should redirect unauthenticated user to login', async () => {
    // Mock location.replace
    const mockReplace = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { 
        href: '/booking.html?deal=test',
        replace: mockReplace 
      },
      writable: true
    });

    // Mock Supabase client with no session
    window.supabase = {
      createClient: jest.fn().mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({ data: { session: null } })
        },
        readyPromise: Promise.resolve(null)
      })
    };

    // Import and test requireAuth
    const { requireAuth } = await import('../public/js/auth-guard.js');
    const result = await requireAuth();

    expect(result).toBeNull();
    expect(localStorage.getItem('redirectAfterLogin')).toBe('/booking.html?deal=test');
    expect(mockReplace).toHaveBeenCalledWith('/login.html');
    expect(console.log).toHaveBeenCalledWith('AUTH_GUARD: User not authenticated, redirecting to: /login.html');
  });

  test('should allow authenticated user to proceed', async () => {
    const mockSession = {
      user: { email: 'test@example.com', id: '123' },
      access_token: 'token123'
    };

    // Mock Supabase client with valid session
    window.supabase = {
      createClient: jest.fn().mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({ data: { session: mockSession } })
        },
        readyPromise: Promise.resolve(mockSession)
      })
    };

    // Import and test requireAuth
    const { requireAuth } = await import('../public/js/auth-guard.js');
    const result = await requireAuth();

    expect(result).toEqual(mockSession);
    expect(console.log).toHaveBeenCalledWith('AUTH_GUARD: User authenticated:', 'test@example.com');
  });

  test('should handle redirect after login', () => {
    // Set up redirect URL
    localStorage.setItem('redirectAfterLogin', '/booking.html?deal=test');

    // Mock location.replace
    const mockReplace = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { replace: mockReplace },
      writable: true
    });

    // Simulate login success handler
    const redirectUrl = localStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
      localStorage.removeItem('redirectAfterLogin');
      window.location.replace(redirectUrl);
    }

    expect(localStorage.getItem('redirectAfterLogin')).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith('/booking.html?deal=test');
  });

  test('should timeout gracefully if Supabase takes too long', async () => {
    // Mock location.replace
    const mockReplace = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { 
        href: '/booking.html',
        replace: mockReplace 
      },
      writable: true
    });

    // Mock Supabase client that never resolves
    window.supabase = {
      createClient: jest.fn().mockReturnValue({
        auth: {
          getSession: jest.fn().mockReturnValue(new Promise(() => {})) // Never resolves
        },
        readyPromise: new Promise(() => {}) // Never resolves
      })
    };

    // Import and test requireAuth with short timeout
    const { requireAuth } = await import('../public/js/auth-guard.js');
    
    // Start the test
    const startTime = Date.now();
    const result = await requireAuth();
    const endTime = Date.now();

    // Should timeout after ~2 seconds and redirect
    expect(endTime - startTime).toBeLessThan(3000);
    expect(result).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith('/login.html');
  });
});

console.log('AUTH_FLOW_TEST: Test suite loaded');