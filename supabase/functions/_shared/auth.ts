
import { corsHeaders } from './cors.ts';

// Secret token constants
const INTERNAL_TOKEN_KEY = Deno.env.get('INTERNAL_TOKEN_KEY');
const ALLOWED_IPS = Deno.env.get('ALLOWED_IPS')?.split(',') || [];

export interface AdminAuthResult {
  authorized: boolean;
  reason?: string;
}

/**
 * Verifies if the request is authorized for admin operations
 */
export function verifyAdminRequest(req: Request, functionName: string): AdminAuthResult {
  // Check if internal token is configured
  if (!INTERNAL_TOKEN_KEY) {
    console.warn(`[${functionName}] INTERNAL_TOKEN_KEY is not configured`);
    // For now, temporarily allow access if token is not configured
    // This ensures backward compatibility but should be addressed ASAP
    // TODO: Make this more restrictive in production
    return { authorized: true, reason: 'Configuration needed but temporarily allowed' };
  }

  // 1. Check for internal token
  const internalToken = req.headers.get('x-internal-token');
  if (!internalToken) {
    console.warn(`[${functionName}] Missing internal token`);
    return { authorized: false, reason: 'Missing authentication' };
  }

  // Verify token matches
  if (internalToken !== INTERNAL_TOKEN_KEY) {
    console.warn(`[${functionName}] Invalid internal token provided`);
    return { authorized: false, reason: 'Invalid authentication' };
  }

  // 2. Check IP restrictions if configured
  if (ALLOWED_IPS.length > 0) {
    // Get client IP from the request
    // This assumes Supabase Edge Functions pass the client IP in the x-forwarded-for header
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim();
    
    if (clientIp && !ALLOWED_IPS.includes(clientIp)) {
      console.warn(`[${functionName}] Request from unauthorized IP: ${clientIp}`);
      return { authorized: false, reason: 'Unauthorized request origin' };
    }
  }
  
  // All checks passed, request is authorized
  return { authorized: true };
}

/**
 * Creates an unauthorized response with proper CORS headers
 */
export function createUnauthorizedResponse(reason: string): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Unauthorized',
      message: reason
    }),
    {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Log function for audit trails
 */
export function logAdminAction(functionName: string, action: string, details: Record<string, any>): void {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    function: functionName,
    action,
    ...details
  }));
}
