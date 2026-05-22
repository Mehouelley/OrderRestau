<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\RestaurantTable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use App\Models\Payment;

class OrderController extends Controller
{
    public function create(Request $request): JsonResponse
    {
        if ($request->boolean('__ping')) {
            return response()->json(['ok' => true], 200);
        }

        $validated = $request->validate([
            'restaurant_id' => ['required', 'exists:restaurants,id'],
            'table_id' => ['nullable', 'exists:restaurant_tables,id'],
            'customer_phone' => ['nullable', 'string', 'max:30'],
            'customer_name' => ['nullable', 'string', 'max:255'],
            'order_type' => ['required', 'in:sur_place,emporter'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'special_instructions' => ['nullable', 'string'],
        ]);

        // Verify table belongs to the restaurant if provided
        if (isset($validated['table_id']) && $validated['table_id']) {
                $table = RestaurantTable::where('id', $validated['table_id'])
                ->where('restaurant_id', $validated['restaurant_id'])
                ->firstOrFail();
        }

        $items = $validated['items'];
                    $step = (int) $request->input('__step', 0);

        unset($validated['items']);

        $total = 0;
        $avgPrepTime = 0;
        $itemCount = 0;
        $orderItemsPayload = [];

        // Validate products and build a normalized payload for order items.
        foreach ($items as $item) {
            $product = Product::query()
                ->where('id', $item['product_id'])
                ->where('restaurant_id', $validated['restaurant_id'])
                ->firstOrFail();

            $quantity = (int) $item['quantity'];
            $unitPrice = (float) $product->price;

            $orderItemsPayload[] = [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
            ];

            $total += $unitPrice * $quantity;
            $avgPrepTime += $product->prep_time_minutes * $quantity;
            $itemCount += $quantity;
        }

        $avgPrepTime = $itemCount > 0 ? (int) ceil($avgPrepTime / $itemCount) : 15;

        // Create order
        $order = Order::create([
            'restaurant_id' => $validated['restaurant_id'],
            'table_id' => $validated['table_id'] ?? null,
            'customer_phone' => $validated['customer_phone'] ?? null,
            'customer_name' => $validated['customer_name'] ?? null,
            'order_type' => $validated['order_type'],
            'status' => 'en_attente_paiement',
            'special_instructions' => $validated['special_instructions'] ?? null,
            'total' => $total,
            'estimated_prep_minutes' => $avgPrepTime,
            'promised_ready_at' => Carbon::now()->addMinutes($avgPrepTime),
        ]);

        // Create order items
        foreach ($orderItemsPayload as $itemPayload) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $itemPayload['product_id'],
                'product_name' => $itemPayload['product_name'],
                'quantity' => $itemPayload['quantity'],
                'unit_price' => $itemPayload['unit_price'],
            ]);
        }

        return response()->json([
            'id' => $order->id,
            'restaurant_id' => $order->restaurant_id,
            'table_id' => $order->table_id,
            'customer_phone' => $order->customer_phone,
            'customer_name' => $order->customer_name,
            'order_type' => $order->order_type,
            'status' => $order->status,
            'total' => (float) $order->total,
            'estimated_prep_minutes' => $order->estimated_prep_minutes,
            'promised_ready_at' => $order->promised_ready_at,
            'created_at' => $order->created_at,
            'served_at' => $order->served_at,
            'finished_at' => $order->finished_at,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $order = Order::with(['restaurant', 'table', 'items.product', 'payments'])->findOrFail($id);
        $items = $order->items->map(function ($item) {
            return [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'product_name' => $item->product?->name ?? $item->product_name,
                'quantity' => $item->quantity,
                'unit_price' => (float) $item->unit_price,
            ];
        });

        return response()->json([
            'id' => $order->id,
            'restaurant_id' => $order->restaurant_id,
            'restaurant_name' => $order->restaurant?->name,
            'table_id' => $order->table_id,
            'table_name' => $order->table?->name,
            'customer_phone' => $order->customer_phone,
            'customer_name' => $order->customer_name,
            'order_type' => $order->order_type,
            'status' => $order->status,
            'total' => (float) $order->total,
            'estimated_prep_minutes' => $order->estimated_prep_minutes,
            'promised_ready_at' => $order->promised_ready_at,
            'payment_status' => $order->payments->first()?->status ?? 'en_attente',
            'payment_method' => $order->payments->first()?->method,
            'payment_confirmed_at' => $order->payments->first()?->confirmed_at,
            'special_instructions' => $order->special_instructions,
            'items' => $items,
            'created_at' => $order->created_at,
            'served_at' => $order->served_at,
            'finished_at' => $order->finished_at,
        ]);
    }

    public function listOwned(Request $request): JsonResponse
    {
        $user = $request->user();
        $restaurant = $user->restaurants()->latest()->firstOrFail();

        $status = $request->query('status');
        $query = $restaurant->orders()->with(['items', 'table', 'payments'])->where('status', '!=', 'en_attente_paiement');

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        $orders = $query->orderByDesc('created_at')->get()->map(function ($o) {
            return [
                'id' => $o->id,
                'table_id' => $o->table_id,
                'table_name' => $o->table?->name,
                'customer_phone' => $o->customer_phone,
                'customer_name' => $o->customer_name,
                'order_type' => $o->order_type,
                'status' => $o->status,
                'total' => (float) $o->total,
                'estimated_prep_minutes' => $o->estimated_prep_minutes,
                'promised_ready_at' => $o->promised_ready_at,
                'payment_status' => $o->payments->first()?->status ?? 'en_attente',
                'payment_method' => $o->payments->first()?->method,
                'payment_confirmed_at' => $o->payments->first()?->confirmed_at,
                'item_count' => $o->items->sum('quantity'),
                'created_at' => $o->created_at,
                'served_at' => $o->served_at,
                'finished_at' => $o->finished_at,
            ];
        });

        return response()->json($orders);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $restaurant = $user->restaurants()->latest()->firstOrFail();
        $order = $restaurant->orders()->findOrFail($id);

        $validated = $request->validate([
            'status' => ['required', 'in:nouvelle,en_cours,prete,servie,terminee,annulee'],
        ]);

        $oldStatus = $order->status;
        $order->update(['status' => $validated['status']]);

        if ($validated['status'] === 'servie') {
            $order->update(['served_at' => now()]);
        }

        if ($validated['status'] === 'terminee' && $order->table_id) {
            $order->table->update(['status' => 'libre', 'estimated_free_at' => now()]);
            $order->update(['finished_at' => now()]);
        }

        return response()->json([
            'id' => $order->id,
            'status' => $order->status,
            'updated_at' => $order->updated_at,
        ]);
    }

    // Return a printable invoice HTML for a given order id.
    public function invoice(int $id)
    {
        $order = Order::with(['restaurant', 'table', 'items', 'payments'])->findOrFail($id);
        $payment = $order->payments->first();

        // Render a simple invoice view (print-friendly)
        return response()->view('invoice', [
            'order' => $order,
            'payment' => $payment,
        ])->header('Content-Type', 'text/html');
    }
}
