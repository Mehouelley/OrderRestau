<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $restaurant = $request->user()->restaurants()->latest()->firstOrFail();

        $todayStart = Carbon::today();
        $todayEnd = Carbon::tomorrow();

        $ordersTodayQuery = Order::where('restaurant_id', $restaurant->id)
            ->where('status', '!=', 'en_attente_paiement')
            ->whereBetween('created_at', [$todayStart, $todayEnd]);

        $caToday = (int) round((float) $ordersTodayQuery->clone()->sum('total'));
        $ordersToday = $ordersTodayQuery->clone()->count();

        $activeClients = Order::where('restaurant_id', $restaurant->id)
            ->where('status', '!=', 'en_attente_paiement')
            ->whereIn('status', ['nouvelle', 'en_cours', 'prete', 'servie'])
            ->where('order_type', 'sur_place')
            ->distinct('table_id')
            ->count('table_id');

        $avgWaitMinutes = (int) round(
            (float) Order::where('restaurant_id', $restaurant->id)
                ->where('status', '!=', 'en_attente_paiement')
                ->whereBetween('created_at', [$todayStart, $todayEnd])
                ->whereIn('status', ['nouvelle', 'en_cours', 'prete', 'servie'])
                ->avg('estimated_prep_minutes')
        );

        $hourlyMap = Order::selectRaw('HOUR(created_at) as hour, COUNT(*) as total')
            ->where('restaurant_id', $restaurant->id)
            ->where('status', '!=', 'en_attente_paiement')
            ->whereBetween('created_at', [$todayStart, $todayEnd])
            ->groupBy(DB::raw('HOUR(created_at)'))
            ->pluck('total', 'hour')
            ->toArray();

        $hourlyOrders = [];
        for ($hour = 0; $hour < 24; $hour++) {
            $hourlyOrders[] = (int) ($hourlyMap[$hour] ?? 0);
        }

        $weeklyRaw = Order::selectRaw('DATE(created_at) as day, SUM(total) as amount')
            ->where('restaurant_id', $restaurant->id)
            ->where('status', '!=', 'en_attente_paiement')
            ->where('created_at', '>=', Carbon::today()->subDays(6))
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('day')
            ->get()
            ->keyBy('day');

        $weekdayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        $weeklyCA = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $key = $date->toDateString();
            $weeklyCA[] = [
                'day' => $weekdayLabels[$date->dayOfWeek],
                'amount' => (int) round((float) ($weeklyRaw[$key]->amount ?? 0)),
            ];
        }

        $orderTypeSplit = [
            'sur_place' => (int) Order::where('restaurant_id', $restaurant->id)->where('status', '!=', 'en_attente_paiement')->where('order_type', 'sur_place')->count(),
            'emporter' => (int) Order::where('restaurant_id', $restaurant->id)->where('status', '!=', 'en_attente_paiement')->where('order_type', 'emporter')->count(),
        ];

        $topProducts = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->where('orders.restaurant_id', $restaurant->id)
            ->where('orders.status', '!=', 'en_attente_paiement')
            ->selectRaw('products.name as name, SUM(order_items.quantity) as count')
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('count')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->name,
                'count' => (int) $row->count,
            ])
            ->values();

        return response()->json([
            'caToday' => $caToday,
            'ordersToday' => $ordersToday,
            'activeClients' => $activeClients,
            'avgWaitMinutes' => $avgWaitMinutes,
            'hourlyOrders' => $hourlyOrders,
            'topProducts' => $topProducts,
            'orderTypeSplit' => $orderTypeSplit,
            'weeklyCA' => $weeklyCA,
        ]);
    }
}
