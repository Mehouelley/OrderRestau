<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use App\Services\CloudinaryService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RestaurantController extends Controller
{
    public function __construct(private readonly CloudinaryService $cloudinary) {}

    private function resolveImageUrl(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        // If it's an absolute URL, return as-is
        if (preg_match('/^https?:\/\//i', $value)) {
            return $value;
        }

        // Return relative path - let frontend resolve it via resolveMediaUrl()
        return $value;
    }

    private function restaurantPayload(Restaurant $restaurant): array
    {
        $freeTables = $restaurant->tables->where('status', 'libre')->count();
        $totalTables = $restaurant->tables->count();
        $avgPrep = $restaurant->orders->avg('estimated_prep_minutes');

        if ($avgPrep === null) {
            $avgPrep = $restaurant->products->avg('prep_time_minutes') ?? 18;
        }

        return [
            'id' => $restaurant->id,
            'name' => $restaurant->name,
            'slug' => $restaurant->slug,
            'address' => $restaurant->address,
            'phone' => $restaurant->phone,
            'email' => $restaurant->email,
            'image_url' => $this->resolveImageUrl($restaurant->image_url),
            'avgPrep' => (int) $avgPrep,
            'open' => true,
            'image' => $this->resolveImageUrl($restaurant->image_url) ?: 'https://images.pexels.com/photos/2608049/pexels-photo-2608049.jpeg?auto=compress&cs=tinysrgb&w=600',
            'tablesAvailable' => $freeTables,
            'tablesTotal' => $totalTables,
        ];
    }

    public function listPublic(): JsonResponse
    {
        $restaurants = Restaurant::with(['tables', 'products', 'orders' => function ($q) {
            $q->whereDate('created_at', today())->where('status', '!=', 'en_attente_paiement')->where('status', '!=', 'servie');
        }])->get()->map(fn (Restaurant $restaurant) => $this->restaurantPayload($restaurant));

        return response()->json($restaurants);
    }

    public function showPublic(string $slug): JsonResponse
    {
        $restaurant = Restaurant::where('slug', $slug)->with(['tables', 'products', 'orders' => function ($q) {
            $q->whereDate('created_at', today())->where('status', '!=', 'en_attente_paiement')->where('status', '!=', 'servie');
        }])->firstOrFail();

        return response()->json($this->restaurantPayload($restaurant));
    }

    public function showOwned(Request $request): JsonResponse
    {
        $user = $request->user();
        $restaurant = $user->restaurants()->latest()->firstOrFail();

        return response()->json([
            'id' => $restaurant->id,
            'name' => $restaurant->name,
            'slug' => $restaurant->slug,
            'phone' => $restaurant->phone,
            'email' => $restaurant->email,
            'address' => $restaurant->address,
            'image_url' => $this->resolveImageUrl($restaurant->image_url),
            'access_code' => $restaurant->access_code,
            'max_capacity' => $restaurant->max_capacity,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $restaurant = $user->restaurants()->latest()->first();
        if (!$restaurant) {
            return response()->json(['message' => 'Restaurant not found'], 404);
        }

        try {
            $validated = $request->validate([
                'name' => ['nullable', 'string', 'max:255'],
                'phone' => ['nullable', 'string', 'max:30'],
                'email' => ['nullable', 'email', 'max:255'],
                'address' => ['nullable', 'string', 'max:500'],
                'access_code' => ['nullable', 'string', 'max:20'],
                'max_capacity' => ['nullable', 'integer', 'min:1'],
                'logo' => ['nullable', 'image', 'max:20480'], // 20MB
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }

        if ($request->hasFile('logo')) {
            $file = $request->file('logo');

            if ($restaurant->image_url && ! preg_match('/^https?:\/\//i', $restaurant->image_url)) {
                Storage::disk('public')->delete($restaurant->image_url);
            } elseif ($this->cloudinary->isCloudinaryUrl($restaurant->image_url)) {
                $this->cloudinary->destroyByUrl($restaurant->image_url);
            }

            $uploaded = $this->cloudinary->uploadImage($file, 'orderrestau/restaurants/logos');

            if ($uploaded) {
                $validated['image_url'] = $uploaded['url'];
            } else {
                $validated['image_url'] = $file->store('restaurants/logos', 'public');
            }
        }

        unset($validated['logo']);

        $restaurant->update($validated);

        $restaurant->refresh();

        return response()->json([
            'id' => $restaurant->id,
            'owner_id' => $restaurant->owner_id,
            'name' => $restaurant->name,
            'slug' => $restaurant->slug,
            'phone' => $restaurant->phone,
            'email' => $restaurant->email,
            'address' => $restaurant->address,
            'image_url' => $this->resolveImageUrl($restaurant->image_url),
            'access_code' => $restaurant->access_code,
            'max_capacity' => $restaurant->max_capacity,
        ]);
    }
}
