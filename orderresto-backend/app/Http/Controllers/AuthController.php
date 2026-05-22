<?php

namespace App\Http\Controllers;

use App\Models\ApiToken;
use App\Models\Restaurant;
use App\Models\RestaurantTable;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'restaurantName' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'image_url' => ['nullable', 'url', 'max:2048'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $user = User::create([
            'name' => $validated['restaurantName'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $restaurant = Restaurant::create([
            'owner_id' => $user->id,
            'name' => $validated['restaurantName'],
            'slug' => $this->generateUniqueSlug($validated['restaurantName']),
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'],
            'image_url' => $validated['image_url'] ?? null,
            'access_code' => '1234',
        ]);

        foreach (range(1, 5) as $index) {
            RestaurantTable::create([
                'restaurant_id' => $restaurant->id,
                'name' => 'Table '.$index,
                'status' => 'libre',
            ]);
        }

        $token = $this->createTokenForUser($user);

        return response()->json([
            'token' => $token,
            'user' => $user,
            'restaurant' => $restaurant,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Email ou mot de passe incorrect.'], 422);
        }

        $restaurant = $user->restaurants()->latest()->first();
        $token = $this->createTokenForUser($user);

        return response()->json([
            'token' => $token,
            'user' => $user,
            'restaurant' => $restaurant,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->attributes->get('api_token');

        if ($token instanceof ApiToken) {
            $token->delete();
        }

        return response()->json(['message' => 'Déconnecté avec succès.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => $user,
            'restaurant' => $user?->restaurants()->latest()->first(),
        ]);
    }

    private function createTokenForUser(User $user): string
    {
        $plainToken = Str::random(64);

        ApiToken::create([
            'user_id' => $user->id,
            'name' => 'default',
            'token_hash' => hash('sha256', $plainToken),
            'last_used_at' => now(),
            'expires_at' => now()->addDays(30),
        ]);

        return $plainToken;
    }

    private function generateUniqueSlug(string $restaurantName): string
    {
        $baseSlug = Str::slug($restaurantName);
        $slug = $baseSlug;
        $suffix = 0;

        while (Restaurant::where('slug', $slug)->exists()) {
            $suffix++;
            $slug = $baseSlug.'-'.Str::lower(Str::random(5));
        }

        return $slug;
    }
}
