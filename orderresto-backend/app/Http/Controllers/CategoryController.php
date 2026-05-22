<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function listByRestaurant(string $slug): JsonResponse
    {
        $categories = Category::whereHas('restaurant', function ($q) use ($slug) {
            $q->where('slug', $slug);
        })->orderBy('sort_order')->get()->map(function ($c) {
            return [
                'id' => $c->id,
                'name' => $c->name,
                'sort_order' => $c->sort_order,
            ];
        });

        return response()->json($categories);
    }

    public function listOwned(Request $request): JsonResponse
    {
        $user = $request->user();
        $restaurant = $user->restaurants()->latest()->firstOrFail();
        $categories = $restaurant->categories()->orderBy('sort_order')->get()->map(function ($c) {
            return [
                'id' => $c->id,
                'name' => $c->name,
                'sort_order' => $c->sort_order,
            ];
        });

        return response()->json($categories);
    }

    public function create(Request $request): JsonResponse
    {
        $user = $request->user();
        $restaurant = $user->restaurants()->latest()->firstOrFail();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $category = $restaurant->categories()->create($validated);

        return response()->json([
            'id' => $category->id,
            'name' => $category->name,
            'sort_order' => $category->sort_order,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $restaurant = $user->restaurants()->latest()->firstOrFail();
        
        // Verify category belongs to this restaurant
        $category = Category::where('id', $id)->where('restaurant_id', $restaurant->id)->firstOrFail();

        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $category->update($validated);

        return response()->json([
            'id' => $category->id,
            'name' => $category->name,
            'sort_order' => $category->sort_order,
        ]);
    }

    public function delete(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $restaurant = $user->restaurants()->latest()->firstOrFail();
        
        // Verify category belongs to this restaurant
        $category = Category::where('id', $id)->where('restaurant_id', $restaurant->id)->firstOrFail();

        $category->delete();

        return response()->json(['message' => 'Category deleted']);
    }
}
