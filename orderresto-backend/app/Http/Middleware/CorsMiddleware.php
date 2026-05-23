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

        // Vérifier si l'origine est autorisée
        $isOriginAllowed = $origin && in_array($origin, $allowedOrigins);

        // Forcer l'API à répondre en JSON pour éviter que Laravel redirige sur erreurs de validation
        // MAIS: exclure les GET et les routes de redirection (callbacks)
        $isModifyingRequest = in_array($request->getMethod(), ['POST', 'PUT', 'PATCH', 'DELETE']);

        // Traiter les requêtes preflight (OPTIONS)
        if ($request->isMethod('OPTIONS')) {
            $response = response('', 200);
            if ($isOriginAllowed) {
                $response->header('Access-Control-Allow-Origin', $origin)
                    ->header('Access-Control-Allow-Credentials', 'true')
                    ->header('Access-Control-Allow-Methods', implode(', ', config('cors.allowed_methods', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])))
                    ->header('Access-Control-Allow-Headers', implode(', ', config('cors.allowed_headers', ['Content-Type', 'Authorization'])))
                    ->header('Access-Control-Max-Age', config('cors.max_age', 3600));
            }
            return $response;
        }

        // Traiter les requêtes normales
        $response = $next($request);

        if ($isOriginAllowed) {
            $response->header('Access-Control-Allow-Origin', $origin)
                ->header('Access-Control-Allow-Credentials', 'true')
                ->header('Access-Control-Allow-Methods', implode(', ', config('cors.allowed_methods', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])))
                ->header('Access-Control-Allow-Headers', implode(', ', config('cors.allowed_headers', ['Content-Type', 'Authorization'])))
                ->header('Access-Control-Max-Age', config('cors.max_age', 3600));
        }

        return $response;
    }
}
