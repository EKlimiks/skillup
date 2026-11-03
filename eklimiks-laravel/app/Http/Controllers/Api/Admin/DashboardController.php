<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Http\Resources\ReviewResource;
use App\Models\Booking;
use App\Models\Lead;
use App\Models\Order;
use App\Models\Product;
use App\Models\RepairRequest;
use App\Models\Review;
use App\Models\TradeIn;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * Сводная панель администратора: счётчики, выручка и последние записи.
 */
class DashboardController extends Controller
{
    /**
     * GET /api/admin/dashboard
     */
    public function index(): JsonResponse
    {
        $revenue = (float) Order::query()
            ->whereNotIn('status', [Order::STATUS_CANCELLED])
            ->sum('total');

        $revenueThisMonth = (float) Order::query()
            ->whereNotIn('status', [Order::STATUS_CANCELLED])
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->sum('total');

        $revenueToday = (float) Order::query()
            ->whereNotIn('status', [Order::STATUS_CANCELLED])
            ->whereDate('created_at', now()->toDateString())
            ->sum('total');

        return response()->json([
            'counters' => [
                'products' => Product::query()->count(),
                'products_out_of_stock' => Product::query()->where('stock', '<=', 0)->count(),
                'categories' => \App\Models\Category::query()->count(),
                'orders' => Order::query()->count(),
                'orders_new' => Order::query()->where('status', Order::STATUS_NEW)->count(),
                'repair_requests' => RepairRequest::query()->count(),
                'repair_requests_new' => RepairRequest::query()->where('status', RepairRequest::STATUS_NEW)->count(),
                'trade_ins' => TradeIn::query()->count(),
                'trade_ins_new' => TradeIn::query()->where('status', TradeIn::STATUS_NEW)->count(),
                'bookings' => Booking::query()->count(),
                'bookings_new' => Booking::query()->where('status', Booking::STATUS_NEW)->count(),
                'users' => User::query()->count(),
                'clients' => User::query()->where('role', User::ROLE_CLIENT)->count(),
                'leads' => Lead::query()->count(),
                'leads_new' => Lead::query()->where('status', Lead::STATUS_NEW)->count(),
                'reviews' => Review::query()->count(),
                'reviews_pending' => Review::query()->where('is_approved', false)->count(),
            ],
            'revenue' => [
                'total' => round($revenue, 2),
                'month' => round($revenueThisMonth, 2),
                'today' => round($revenueToday, 2),
                'average_order' => Order::query()->whereNotIn('status', [Order::STATUS_CANCELLED])->count() > 0
                    ? round($revenue / Order::query()->whereNotIn('status', [Order::STATUS_CANCELLED])->count(), 2)
                    : 0.0,
            ],
            'sales_by_day' => $this->salesByDay(),
            'orders_by_status' => $this->ordersByStatus(),
            'top_products' => $this->topProducts(),
            'recent_orders' => OrderResource::collection(
                Order::query()->with(['items.product', 'user'])->orderByDesc('created_at')->limit(5)->get()
            )->resolve(),
            'recent_repairs' => RepairRequest::query()
                ->with(['service', 'master'])
                ->orderByDesc('created_at')
                ->limit(5)
                ->get()
                ->map(fn (RepairRequest $r) => [
                    'id' => $r->id,
                    'device_model' => $r->device_model,
                    'status' => $r->status,
                    'status_label' => $r->status_label,
                    'service' => $r->service?->name,
                    'master' => $r->master?->name,
                    'customer_name' => $r->customer_name,
                    'customer_phone' => $r->customer_phone,
                    'created_at' => $r->created_at?->toIso8601String(),
                ]),
            'recent_leads' => Lead::query()
                ->orderByDesc('created_at')
                ->limit(5)
                ->get()
                ->map(fn (Lead $lead) => [
                    'id' => $lead->id,
                    'name' => $lead->name,
                    'phone' => $lead->phone,
                    'type' => $lead->type,
                    'type_label' => $lead->type_label,
                    'status' => $lead->status,
                    'created_at' => $lead->created_at?->toIso8601String(),
                ]),
            'pending_reviews' => ReviewResource::collection(
                Review::query()->with('product')->where('is_approved', false)->orderByDesc('created_at')->limit(5)->get()
            )->resolve(),
        ]);
    }

    /**
     * Продажи за последние 14 дней (для графика в админке).
     *
     * @return array<int, array{date: string, orders: int, revenue: float}>
     */
    private function salesByDay(): array
    {
        $from = now()->subDays(13)->startOfDay();

        $rows = Order::query()
            ->selectRaw('DATE(created_at) as day, COUNT(*) as orders, SUM(total) as revenue')
            ->where('created_at', '>=', $from)
            ->whereNotIn('status', [Order::STATUS_CANCELLED])
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('day')
            ->get()
            ->keyBy(fn ($row) => (string) $row->day);

        $result = [];

        for ($i = 0; $i < 14; $i++) {
            $date = $from->copy()->addDays($i)->toDateString();
            $row = $rows->get($date);

            $result[] = [
                'date' => $date,
                'orders' => (int) ($row->orders ?? 0),
                'revenue' => round((float) ($row->revenue ?? 0), 2),
            ];
        }

        return $result;
    }

    /**
     * @return array<string, int>
     */
    private function ordersByStatus(): array
    {
        $result = [];

        foreach (Order::STATUSES as $status) {
            $result[$status] = Order::query()->where('status', $status)->count();
        }

        return $result;
    }

    /**
     * Топ-5 товаров по количеству проданных единиц.
     *
     * @return array<int, array<string, mixed>>
     */
    private function topProducts(): array
    {
        return DB::table('order_items')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereNotIn('orders.status', [Order::STATUS_CANCELLED])
            ->selectRaw('products.id, products.name, products.slug, SUM(order_items.qty) as sold, SUM(order_items.qty * order_items.price) as revenue')
            ->groupBy('products.id', 'products.name', 'products.slug')
            ->orderByDesc('sold')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'name' => $row->name,
                'slug' => $row->slug,
                'sold' => (int) $row->sold,
                'revenue' => round((float) $row->revenue, 2),
            ])
            ->all();
    }
}
