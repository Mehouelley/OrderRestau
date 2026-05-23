<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FedapayController extends Controller
{
    private function fedapayBaseUrl(): string
    {
        $custom = env('FEDAPAY_BASE_URL');
        if ($custom) {
            return rtrim($custom, '/');
        }

        $envMode = strtolower((string) env('FEDAPAY_ENV', 'sandbox'));
        if ($envMode === 'live') {
            return 'https://api.fedapay.com/v1';
        }

        return 'https://sandbox-api.fedapay.com/v1';
    }

    private function fedapayHeaders(string $apiKey): array
    {
        return [
            'Authorization' => 'Bearer ' . $apiKey,
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ];
    }

    private function fedapayClient(string $apiKey): PendingRequest
    {
        $client = Http::withHeaders($this->fedapayHeaders($apiKey));

        if (!config('services.fedapay.verify_ssl', true)) {
            $client = $client->withoutVerifying();
        }

        return $client;
    }

    private function applyTransactionStatus(array $transaction): array
    {
        $status = strtolower((string) ($transaction['status'] ?? ''));
        $orderId = $transaction['custom_metadata']['order_id'] ?? null;

        if (!$orderId) {
            return ['ok' => false, 'message' => 'order_id missing in transaction metadata'];
        }

        $order = Order::find($orderId);
        if (!$order) {
            return ['ok' => false, 'message' => 'order not found', 'order_id' => $orderId];
        }

        $existingPayment = Payment::where('order_id', $order->id)->first();

        if ($existingPayment && $existingPayment->status === 'confirmee' && in_array($status, ['approved', 'paid', 'confirmed', 'succeeded'], true)) {
            return [
                'ok' => true,
                'paid' => true,
                'order_id' => $order->id,
                'payment_id' => $existingPayment->id,
                'status' => $status,
                'message' => 'transaction already processed',
            ];
        }

        if (in_array($status, ['approved', 'paid', 'confirmed', 'succeeded'], true)) {
            $payment = Payment::updateOrCreate(
                ['order_id' => $order->id],
                [
                    'method' => 'fedapay',
                    'status' => 'confirmee',
                    'amount' => $order->total,
                    'confirmed_at' => Carbon::now(),
                ]
            );

            $order->update(['status' => 'nouvelle']);

            if ($order->table_id && $order->order_type === 'sur_place') {
                $order->table()->update(['status' => 'occupee']);
            }

            return [
                'ok' => true,
                'paid' => true,
                'order_id' => $order->id,
                'payment_id' => $payment->id,
                'status' => $status,
            ];
        }

        if (in_array($status, ['failed', 'cancelled', 'canceled', 'declined'], true)) {
            $payment = Payment::updateOrCreate(
                ['order_id' => $order->id],
                [
                    'method' => 'fedapay',
                    'status' => 'echec',
                    'amount' => $order->total,
                ]
            );

            return [
                'ok' => true,
                'paid' => false,
                'order_id' => $order->id,
                'payment_id' => $payment->id,
                'status' => $status,
            ];
        }

        return [
            'ok' => true,
            'paid' => false,
            'order_id' => $order->id,
            'status' => $status,
            'message' => 'transaction status not final',
        ];
    }

    private function fetchTransactionById(string $transactionId): array
    {
        $apiKey = env('FEDAPAY_SECRET');
        if (!$apiKey) {
            return ['ok' => false, 'message' => 'FEDAPAY_SECRET not configured'];
        }

        $res = $this->fedapayClient($apiKey)
            ->get($this->fedapayBaseUrl() . '/transactions/' . $transactionId);

        if (!$res->successful()) {
            return [
                'ok' => false,
                'message' => 'failed to fetch transaction',
                'status' => $res->status(),
                'details' => $res->body(),
            ];
        }

        $data = $res->json();
        $transaction = $data['v1/transaction'] ?? $data;

        if (!is_array($transaction)) {
            return ['ok' => false, 'message' => 'invalid transaction payload', 'raw' => $data];
        }

        return ['ok' => true, 'transaction' => $transaction];
    }

    /**
     * Verify webhook signature using FEDAPAY_WEBHOOK_SECRET.
     * Fedapay signs webhooks with HMAC-SHA256 and sends the signature in the X-Fedapay-Signature header.
     */
    private function verifyWebhookSignature(Request $request): bool
    {
        $secret = env('FEDAPAY_WEBHOOK_SECRET');
        if (!$secret) {
            // If no secret configured, warn but allow (for development)
            Log::warning('FEDAPAY_WEBHOOK_SECRET not configured');
            return true;
        }

        $signature = $request->header('X-Fedapay-Signature');
        if (!$signature) {
            Log::warning('Webhook missing X-Fedapay-Signature header');
            return false;
        }

        // Get raw body for signature verification
        $body = $request->getContent();
        $computedSignature = hash_hmac('sha256', $body, $secret);

        // Compare signatures (constant-time comparison)
        return hash_equals($signature, $computedSignature);
    }

    // Fedapay callback_url is called by browser in GET with query params (?id=...&status=...)
    public function callback(Request $request)
    {
        $transactionId = (string) ($request->query('id') ?? $request->input('id') ?? '');

        if ($transactionId === '') {
            if ($request->wantsJson()) {
                return response()->json(['error' => 'transaction id is required'], 400);
            }
            return response('transaction id is required', 400);
        }

        $fetch = $this->fetchTransactionById($transactionId);
        if (!$fetch['ok']) {
            Log::warning('Fedapay callback fetch failed', $fetch + ['transaction_id' => $transactionId]);
            if ($request->wantsJson()) {
                return response()->json(['error' => 'Unable to fetch transaction', 'details' => $fetch], 502);
            }
            return response('Unable to fetch transaction', 502);
        }

        $result = $this->applyTransactionStatus($fetch['transaction']);

        // If browser redirect (GET from user), redirect to frontend success page with invoice link
        if ($request->isMethod('get') && !$request->wantsJson()) {
            $orderId = $result['order_id'] ?? '';
            $paymentId = $result['payment_id'] ?? '';
            $status = $result['status'] ?? ($request->query('status') ?? '');

            $frontend = rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/');
            $invoiceUrl = rtrim((string) env('APP_URL', config('app.url') ?: 'http://localhost:8000'), '/') . '/api/orders/' . $orderId . '/invoice';

            $query = http_build_query([
                'status' => $status,
                'payment_id' => $paymentId,
                'invoice_url' => $invoiceUrl,
            ]);

            $redirectUrl = $frontend . '/paiement/' . $orderId . '?' . $query;
            return redirect()->away($redirectUrl);
        }

        $httpCode = ($result['ok'] ?? false) ? 200 : 422;
        return response()->json([
            'ok' => $result['ok'] ?? false,
            'transaction_id' => $transactionId,
            'query_status' => $request->query('status'),
            'result' => $result,
        ], $httpCode);
    }

    public function createCheckout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => ['required', 'exists:orders,id'],
            'customer_phone' => ['nullable', 'string', 'max:30'],
            'customer_phone_country' => ['nullable', 'string', 'size:2'],
            'customer_name' => ['nullable', 'string', 'max:200'],
            'customer_email' => ['nullable', 'email', 'max:200'],
        ]);

        $order = Order::findOrFail($validated['order_id']);

        $apiKey = env('FEDAPAY_SECRET');
        $appUrl = env('APP_URL', config('app.url')) ?: 'http://localhost:3000';

        if (!$apiKey) {
            return response()->json(['error' => 'Fedapay API key not configured'], 500);
        }

        $transactionPayload = [
            'description' => 'Paiement commande #' . $order->id,
            'amount' => (int) round((float) $order->total),
            'currency' => [
                'iso' => 'XOF',
            ],
            'callback_url' => rtrim($appUrl, '/') . '/api/payments/fedapay/callback',
            'custom_metadata' => [
                'order_id' => $order->id,
            ],
        ];

        // Build customer object for Fedapay if any customer details provided
        $customer = [];
        if (!empty($validated['customer_phone'])) {
            $raw = (string) $validated['customer_phone'];
            $numberOnly = preg_replace('/\D+/', '', $raw);

            // Remove leading zeros that users sometimes include
            $numberOnly = preg_replace('/^0+/', '', $numberOnly);

            // Map dial codes to countries
            $dialCodeToCountry = [
                '221' => 'SN', // Senegal
                '229' => 'BJ', // Benin
                '225' => 'CI', // Côte d'Ivoire
                '223' => 'ML', // Mali
                '226' => 'BF', // Burkina Faso
                '227' => 'NE',
                '228' => 'TG',
                '224' => 'GN',
            ];

            // Try to detect country from dial code
            $detectedCountry = null;
            foreach ($dialCodeToCountry as $dialCode => $country) {
                if (strpos($numberOnly, $dialCode) === 0) {
                    $detectedCountry = $country;
                    break;
                }
            }

            // Use detected country, or explicit param, or none (skip phone if can't determine)
            $country = $detectedCountry ?? strtoupper((string) ($validated['customer_phone_country'] ?? ''));

            // Only include phone if we have a country
            if ($country !== '') {
                // Ensure number starts with dial code if not already
                $countryToDialCode = array_flip($dialCodeToCountry);
                $dialCode = $countryToDialCode[$country] ?? '';

                if ($dialCode !== '' && strpos($numberOnly, $dialCode) !== 0) {
                    $numberOnly = $dialCode . $numberOnly;
                }

                $customer['phone_number'] = [
                    'number' => $numberOnly,
                    'country' => $country,
                ];
            }
        }

        if (!empty($validated['customer_email'])) {
            $customer['email'] = $validated['customer_email'];
        }

        if (!empty($validated['customer_name'])) {
            // Try to split into first and last name
            $parts = preg_split('/\s+/', trim((string) $validated['customer_name']));
            if (count($parts) === 1) {
                $customer['first_name'] = $parts[0];
            } else {
                $customer['first_name'] = array_shift($parts);
                $customer['last_name'] = implode(' ', $parts);
            }
        }

        if (!empty($customer)) {
            $transactionPayload['customer'] = $customer;
        }

        try {
            // Step 1: create transaction
            $txRes = $this->fedapayClient($apiKey)
                ->post($this->fedapayBaseUrl() . '/transactions', $transactionPayload);

            if (!$txRes->successful()) {
                $errorBody = $txRes->body();
                Log::error('Fedapay create transaction error', [
                    'base_url' => $this->fedapayBaseUrl(),
                    'status' => $txRes->status(),
                    'body' => $errorBody,
                    'payload' => $transactionPayload,
                ]);
                return response()->json([
                    'error' => 'Failed to create fedapay transaction',
                    'details' => $errorBody,
                    'status' => $txRes->status(),
                ], 502);
            }

            $txData = $txRes->json();
            $transactionId = $txData['id'] ?? $txData['v1/transaction']['id'] ?? null;

            if (!$transactionId) {
                Log::error('Fedapay transaction id missing', ['response' => $txData]);
                return response()->json([
                    'error' => 'Fedapay transaction created but no id found',
                    'details' => $txData,
                ], 502);
            }

            // Step 2: generate payment link token
            $tokenRes = $this->fedapayClient($apiKey)
                ->post($this->fedapayBaseUrl() . '/transactions/' . $transactionId . '/token');

            if (!$tokenRes->successful()) {
                $errorBody = $tokenRes->body();
                Log::error('Fedapay create token error', [
                    'base_url' => $this->fedapayBaseUrl(),
                    'status' => $tokenRes->status(),
                    'body' => $errorBody,
                    'transaction_id' => $transactionId,
                ]);
                return response()->json([
                    'error' => 'Failed to create fedapay session',
                    'details' => $errorBody,
                    'status' => $tokenRes->status(),
                ], 502);
            }

            $tokenData = $tokenRes->json();
            $paymentUrl = $tokenData['url'] ?? $tokenData['v1/transaction']['url'] ?? null;

            // Persist a pending payment record locally
            $payment = Payment::updateOrCreate(
                ['order_id' => $order->id],
                [
                'order_id' => $order->id,
                'method' => 'fedapay',
                'status' => 'pending',
                'amount' => $order->total,
                ]
            );

            return response()->json([
                'payment' => $payment,
                'transaction_id' => $transactionId,
                'payment_url' => $paymentUrl,
                'raw' => [
                    'transaction' => $txData,
                    'token' => $tokenData,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Fedapay exception', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'error' => 'Exception while creating fedapay session',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // Webhook endpoint called by Fedapay server-to-server to notify payment events.
    // Verifies webhook signature before processing.
    // Expected POST body: { "id": "transaction_id", "status": "approved", ... }
    public function webhook(Request $request): JsonResponse
    {
        // Verify webhook signature first
        if (!$this->verifyWebhookSignature($request)) {
            Log::warning('Fedapay webhook signature verification failed', [
                'ip' => $request->ip(),
                'header' => $request->header('X-Fedapay-Signature'),
            ]);
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $payload = $request->all();
        $transactionId = (string) ($payload['id'] ?? $payload['data']['id'] ?? '');

        if ($transactionId === '') {
            Log::warning('Fedapay webhook: transaction id not found', ['payload' => $payload]);
            return response()->json(['error' => 'transaction id not found'], 400);
        }

        // Fetch full transaction details from API to verify and apply status
        $fetch = $this->fetchTransactionById($transactionId);
        if (!$fetch['ok']) {
            Log::warning('Fedapay webhook fetch failed', $fetch + ['transaction_id' => $transactionId]);
            return response()->json(['error' => 'Unable to fetch transaction', 'details' => $fetch], 502);
        }

        $result = $this->applyTransactionStatus($fetch['transaction']);
        $httpCode = ($result['ok'] ?? false) ? 200 : 422;

        return response()->json([
            'ok' => $result['ok'] ?? false,
            'transaction_id' => $transactionId,
            'result' => $result,
        ], $httpCode);
    }
}
