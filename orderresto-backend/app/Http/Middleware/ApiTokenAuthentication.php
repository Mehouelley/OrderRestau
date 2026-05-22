<?php

namespace App\Http\Middleware;

use App\Models\ApiToken;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenAuthentication
{
    public function handle(Request $request, Closure $next): Response
    {
        $bearerToken = $request->bearerToken() ?: $request->header('X-API-TOKEN');

        if (! $bearerToken) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $token = ApiToken::with('user')
            ->where('token_hash', hash('sha256', $bearerToken))
            ->first();

        if (! $token || ($token->expires_at && $token->expires_at->isPast())) {
            return response()->json(['message' => 'Invalid or expired token.'], 401);
        }

        // Mettre à jour last_used_at sans bloquer la requête
        try {
            $token->update(['last_used_at' => now()]);
        } catch (\Exception $e) {
            // Log mais continue - l'authentification a réussi
            \Illuminate\Support\Facades\Log::warning('Failed to update token last_used_at', [
                'token_id' => $token->id,
                'error' => $e->getMessage(),
            ]);
        }

        $request->attributes->set('api_token', $token);
        $request->setUserResolver(fn () => $token->user);
        Auth::setUser($token->user);

        return $next($request);
    }
}
