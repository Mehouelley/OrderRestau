<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'orderresto-backend',
        'message' => 'API Laravel is running',
    ]);
});

