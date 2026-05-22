<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function confirm(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => ['required', 'exists:orders,id'],
            'method' => ['required', 'in:fedapay'],
            'customer_phone' => ['nullable', 'string', 'max:30'],
        ]);

        $order = Order::with(['table', 'payments'])->findOrFail($validated['order_id']);

        if ($order->payments()->where('status', 'confirmee')->exists()) {
            return response()->json([
                'message' => 'Payment already confirmed',
                'order_id' => $order->id,
            ]);
        }

        $payment = DB::transaction(function () use ($order, $validated) {
            $payment = Payment::updateOrCreate(
                ['order_id' => $order->id],
                [
                    'method' => $validated['method'],
                    'status' => 'confirmee',
                    'amount' => $order->total,
                    'customer_phone' => $validated['customer_phone'] ?? null,
                    'confirmed_at' => Carbon::now(),
                ]
            );

            $order->update(['status' => 'nouvelle']);

            if ($order->table_id && $order->order_type === 'sur_place') {
                $order->table()->update(['status' => 'occupee']);
            }

            return $payment;
        });

        $order->refresh();

        return response()->json([
            'payment' => [
                'id' => $payment->id,
                'order_id' => $payment->order_id,
                'method' => $payment->method,
                'status' => $payment->status,
                'amount' => (float) $payment->amount,
                'confirmed_at' => $payment->confirmed_at,
            ],
            'order' => [
                'id' => $order->id,
                'status' => $order->status,
                'promised_ready_at' => $order->promised_ready_at,
            ],
        ], 201);
    }
}
