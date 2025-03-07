
// This is a Supabase Edge Function that proxies requests to your Django app
// You'll need to deploy your Django app separately and update the DJANGO_URL

import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';

// Replace with your actual Django app URL
const DJANGO_URL = Deno.env.get('DJANGO_URL') || 'https://your-django-app-host.com';

console.log(`Django backend URL: ${DJANGO_URL}`);

serve(async (req) => {
  const url = new URL(req.url);
  
  // Remove /api from the path to match Django's URL structure
  let path = url.pathname;
  if (path.startsWith('/api')) {
    path = path.substring(4);
  }
  
  // Ensure path starts with /
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  const djangoUrl = `${DJANGO_URL}${path}${url.search}`;
  
  console.log(`Proxying request to: ${djangoUrl}`);
  
  try {
    // Copy all request data and headers
    const fetchOptions = {
      method: req.method,
      headers: new Headers(req.headers),
      body: req.body && req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
    };
    
    // Forward the request to Django
    const response = await fetch(djangoUrl, fetchOptions);
    
    // Get the response body as a readable stream
    const body = response.body;
    
    // Copy headers from Django response
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error('Error proxying to Django:', error);
    return new Response(JSON.stringify({ error: 'Failed to connect to the Django backend' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
