<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KitchenController extends Controller
{
    public function access(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:20'],
            'restaurant_slug' => ['nullable', 'string'],
        ]);

        $query = Restaurant::query();

        if (! empty($validated['restaurant_slug'])) {
            $query->where('slug', $validated['restaurant_slug']);
        }

        $restaurant = $query->where('access_code', $validated['code'])->first();

        if (! $restaurant) {
            return response()->json(['message' => 'Code invalide.'], 422);
        }

        return response()->json([
            'restaurant' => [
                'id' => $restaurant->id,
                'name' => $restaurant->name,
                'slug' => $restaurant->slug,
            ],
        ]);
    }

    public function ordersBySlug(string $slug): JsonResponse
    {
        $restaurant = Restaurant::where('slug', $slug)->firstOrFail();

        $orders = Order::with(['items.product', 'table'])
            ->where('restaurant_id', $restaurant->id)
            ->whereIn('status', ['nouvelle', 'en_cours', 'prete'])
            ->latest()
            ->get()
            ->map(function ($order) {
                return [
                    'id' => (string) $order->id,
                    'table_name' => $order->table?->name ?? 'Emporter',
                    'status' => $order->status,
                    'items' => $order->items->map(fn ($item) => [
                        'product_name' => $item->product?->name ?? 'Produit',
                        'quantity' => $item->quantity,
                    ])->values(),
                    'created_at' => $order->created_at,
                    'promised_ready_at' => $order->promised_ready_at,
                    'special_instructions' => $order->special_instructions ?? '',
                ];
            })
            ->values();

        return response()->json([
            'restaurant' => [
                'id' => $restaurant->id,
                'name' => $restaurant->name,
                'slug' => $restaurant->slug,
            ],
            'orders' => $orders,
        ]);
    }

    public function ticket(int $id)
    {
        $order = Order::with(['restaurant', 'table', 'items.product'])->findOrFail($id);

        return response()->view('kitchen-ticket', [
            'order' => $order,
        ])->header('Content-Type', 'text/html');
    }

    public function updateOrderStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:nouvelle,en_cours,prete,servie'],
            'restaurant_slug' => ['required', 'string'],
        ]);

        $restaurant = Restaurant::where('slug', $validated['restaurant_slug'])->firstOrFail();

        $order = Order::where('id', $id)
            ->where('restaurant_id', $restaurant->id)
            ->firstOrFail();

        $order->update(['status' => $validated['status']]);

        if ($validated['status'] === 'servie' && $order->table_id) {
            $order->table()->update(['status' => 'libre', 'estimated_free_at' => now()]);
            $order->update(['served_at' => now()]);
        }

        return response()->json([
            'id' => (string) $order->id,
            'status' => $order->status,
            'updated_at' => $order->updated_at,
        ]);
    }
}
