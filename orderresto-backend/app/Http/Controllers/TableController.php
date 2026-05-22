<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use App\Models\RestaurantTable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TableController extends Controller
{
    public function contextByRestaurant(string $slug, int $tableId): JsonResponse
    {
        $restaurant = Restaurant::where('slug', $slug)->firstOrFail();

        $table = RestaurantTable::query()
            ->where('restaurant_id', $restaurant->id)
            ->where('id', $tableId)
            ->firstOrFail();

        $orders = $table->orders()
            ->with(['items','payments'])
            ->whereNotIn('status', ['terminee', 'annulee'])
            ->latest()
            ->get();

        $ordersPayload = $orders->map(function ($order) {
            return [
                'id' => $order->id,
                'status' => $order->status,
                'order_type' => $order->order_type,
                'customer_phone' => $order->customer_phone,
                'customer_name' => $order->customer_name,
                'payment_status' => $order->payments->first()?->status ?? 'en_attente',
                'created_at' => $order->created_at,
                'items' => $order->items->map(fn ($item) => [
                    'product_name' => $item->product_name,
                    'quantity' => $item->quantity,
                ])->values(),
            ];
        })->values();

        $latestOrder = $orders->first();

        return response()->json([
            'table' => [
                'id' => $table->id,
                'name' => $table->name,
                'status' => $table->status,
                'restaurant_id' => $table->restaurant_id,
            ],
            'occupied' => $table->status === 'occupee',
            'preordered_by' => $latestOrder ? ['phone' => $latestOrder->customer_phone, 'name' => $latestOrder->customer_name] : null,
            'active_orders' => $ordersPayload,
        ]);
    }

    public function listByRestaurant(string $slug): JsonResponse
    {
        $restaurant = Restaurant::where('slug', $slug)->first();

        if (!$restaurant) {
            return response()->json([]);
        }

        // Ensure restaurant has at least 5 default tables
        if ($restaurant->tables()->count() === 0) {
            foreach (range(1, 5) as $index) {
                $restaurant->tables()->create([
                    'name' => 'Table '.$index,
                    'status' => 'libre',
                ]);
            }
        }

        $tables = $restaurant->tables()->get()->map(function ($t) {
            return [
                'id' => $t->id,
                'name' => $t->name,
                'status' => $t->status,
            ];
        });

        return response()->json($tables);
    }

    public function listOwned(Request $request): JsonResponse
    {
        $user = $request->user();
        $restaurant = $user->restaurants()->latest()->firstOrFail();
        $tables = $restaurant->tables()->get()->map(function ($t) {
            return [
                'id' => $t->id,
                'name' => $t->name,
                'status' => $t->status,
            ];
        });

        return response()->json($tables);
    }

    public function create(Request $request): JsonResponse
    {
        $user = $request->user();
        $restaurant = $user->restaurants()->latest()->firstOrFail();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $table = $restaurant->tables()->create($validated + ['status' => 'libre']);

        return response()->json([
            'id' => $table->id,
            'name' => $table->name,
            'status' => $table->status,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $restaurant = $user->restaurants()->latest()->firstOrFail();
        $table = $restaurant->tables()->findOrFail($id);

        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:libre,occupee'],
        ]);

        $table->update($validated);

        return response()->json([
            'id' => $table->id,
            'name' => $table->name,
            'status' => $table->status,
        ]);
    }

    public function delete(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $restaurant = $user->restaurants()->latest()->firstOrFail();
        $table = $restaurant->tables()->findOrFail($id);

        $table->delete();

        return response()->json(['message' => 'Table deleted']);
    }
}
