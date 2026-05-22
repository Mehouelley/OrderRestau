<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $allowedOrigins = config('cors.allowed_origins', []);

        $origin = $request->header('Origin');

        if ($origin && in_array($origin, $allowedOrigins)) {
            return $next($request)
                ->header('Access-Control-Allow-Origin', $origin)
                ->header('Access-Control-Allow-Credentials', 'false')
                ->header('Access-Control-Allow-Methods', implode(', ', config('cors.allowed_methods', ['*'])))
                ->header('Access-Control-Allow-Headers', implode(', ', config('cors.allowed_headers', ['*'])))
                ->header('Access-Control-Max-Age', config('cors.max_age', 0));
        }

        // Handle preflight requests
        if ($request->isMethod('OPTIONS')) {
            return response('', 200)
                ->header('Access-Control-Allow-Origin', $origin ?: '*')
                ->header('Access-Control-Allow-Methods', implode(', ', config('cors.allowed_methods', ['*'])))
                ->header('Access-Control-Allow-Headers', implode(', ', config('cors.allowed_headers', ['*'])))
                ->header('Access-Control-Max-Age', config('cors.max_age', 0));
        }

        return $next($request);
    }
}
