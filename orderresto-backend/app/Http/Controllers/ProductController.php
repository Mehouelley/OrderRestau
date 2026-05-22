<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function listByRestaurant(string $slug): JsonResponse
    {
        $products = Product::whereHas('restaurant', function ($q) use ($slug) {
            $q->where('slug', $slug);
        })->where('available', true)->orderBy('sort_order')->get()->map(function ($p) {
            return [
                'id' => $p->id,
                'category_id' => $p->category_id,
                'name' => $p->name,
                'description' => $p->description,
                'price' => (float) $p->price,
                'prep_time_minutes' => $p->prep_time_minutes,
                'image_url' => $p->image_url,
                'available' => $p->available,
            ];
        });

        return response()->json($products);
    }

    public function listOwned(Request $request): JsonResponse
    {
        $user = $request->user();
        $restaurant = $user->restaurants()->latest()->firstOrFail();
        $products = $restaurant->products()->orderBy('sort_order')->get()->map(function ($p) {
            return [
                'id' => $p->id,
                'category_id' => $p->category_id,
                'name' => $p->name,
                'description' => $p->description,
                'price' => (float) $p->price,
                'prep_time_minutes' => $p->prep_time_minutes,
                'image_url' => $p->image_url,
                'available' => $p->available,
            ];
        });

        return response()->json($products);
    }

    public function create(Request $request): JsonResponse
    {
        $user = $request->user();
        $restaurant = $user->restaurants()->latest()->firstOrFail();

        $validated = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'prep_time_minutes' => ['nullable', 'integer', 'min:1'],
            'image_url' => ['nullable', 'url'],
            'image' => ['nullable', 'image', 'max:20480'],
            'available' => ['nullable', 'boolean'],
        ]);

        // Verify category belongs to this restaurant
        $category = Category::where('id', $validated['category_id'])
            ->where('restaurant_id', $restaurant->id)
            ->firstOrFail();

        // Handle image upload
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $validated['image_url'] = $file->store('products', 'public');
        }

        unset($validated['image']);

        $product = $restaurant->products()->create($validated + [
            'restaurant_id' => $restaurant->id,
            'available' => $validated['available'] ?? true,
            'prep_time_minutes' => $validated['prep_time_minutes'] ?? 15,
        ]);

        return response()->json([
            'id' => $product->id,
            'category_id' => $product->category_id,
            'name' => $product->name,
            'description' => $product->description,
            'price' => (float) $product->price,
            'prep_time_minutes' => $product->prep_time_minutes,
            'image_url' => $product->image_url,
            'available' => $product->available,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $restaurant = $user->restaurants()->latest()->firstOrFail();

        // Verify product belongs to this restaurant
        $product = Product::where('id', $id)->where('restaurant_id', $restaurant->id)->firstOrFail();

        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'prep_time_minutes' => ['nullable', 'integer', 'min:1'],
            'image_url' => ['nullable', 'url'],
            'image' => ['nullable', 'image', 'max:20480'],
            'available' => ['nullable', 'boolean'],
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            if ($product->image_url && ! preg_match('/^https?:\/\//i', $product->image_url)) {
                Storage::disk('public')->delete($product->image_url);
            }
            $validated['image_url'] = $file->store('products', 'public');
        }

        unset($validated['image']);

        $product->update($validated);

        return response()->json([
            'id' => $product->id,
            'category_id' => $product->category_id,
            'name' => $product->name,
            'description' => $product->description,
            'price' => (float) $product->price,
            'prep_time_minutes' => $product->prep_time_minutes,
            'image_url' => $product->image_url,
            'available' => $product->available,
        ]);
    }

    public function delete(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $restaurant = $user->restaurants()->latest()->firstOrFail();

        // Verify product belongs to this restaurant
        $product = Product::where('id', $id)->where('restaurant_id', $restaurant->id)->firstOrFail();

        $product->delete();

        return response()->json(['message' => 'Product deleted']);
    }
}
