<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MethodSpoofing
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->isMethod('POST')) {
            return $next($request);
        }

        $contentType = strtolower((string) $request->header('Content-Type', ''));
        $isFormSubmission = str_contains($contentType, 'multipart/form-data')
            || str_contains($contentType, 'application/x-www-form-urlencoded');

        // Method spoofing is only needed for form submissions.
        if ($isFormSubmission && $request->request->has('_method')) {
            $method = strtoupper((string) $request->request->get('_method'));

            // Override the request method
            $request->setMethod($method);
        }

        return $next($request);
    }
}
