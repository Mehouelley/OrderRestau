<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Enable method spoofing for FormData with _method field
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        $middleware->api(append: [
            \App\Http\Middleware\MethodSpoofing::class,
        ]);

        $middleware->alias([
            'api.token' => \App\Http\Middleware\ApiTokenAuthentication::class,
        ]);
    })
    ->withProviders(
        require base_path('bootstrap/providers.php'),
    )
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
