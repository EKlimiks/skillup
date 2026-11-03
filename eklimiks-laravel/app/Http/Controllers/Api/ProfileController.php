<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Http\Resources\OrderResource;
use App\Http\Resources\RepairRequestResource;
use App\Http\Resources\TradeInResource;
use App\Http\Resources\UserResource;
use App\Models\Booking;
use App\Models\Order;
use App\Models\RepairRequest;
use App\Models\Setting;
use App\Models\TradeIn;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Личный кабинет: профиль, история заказов, ремонтов, Trade-In,
 * бронирований и бонусных начислений.
 */
class ProfileController extends Controller
{
    /**
     * GET /api/profile
     */
    public function show(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'data' => (new UserResource($user->loadCount('orders')))->resolve(),
        ]);
    }

    /**
     * PUT /api/profile
     */
    public function update(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'min:2', 'max:120'],
            'email' => ['sometimes', 'required', 'email', 'max:191', 'unique:users,email,' . $user->id],
            'phone' => ['sometimes', 'nullable', 'string', 'min:6', 'max:32'],
            'password' => ['sometimes', 'nullable', 'string', 'min:6', 'confirmed'],
            'current_password' => ['required_with:password', 'string'],
        ], [
            'name.required' => 'Укажите имя.',
            'email.unique' => 'Этот e-mail уже занят другим пользователем.',
            'password.min' => 'Пароль должен содержать минимум 6 символов.',
            'password.confirmed' => 'Пароли не совпадают.',
            'current_password.required_with' => 'Для смены пароля укажите текущий пароль.',
        ]);

        if (! empty($data['password'])) {
            if (! Hash::check((string) $data['current_password'], $user->password)) {
                return response()->json([
                    'message' => 'Текущий пароль указан неверно.',
                    'errors' => ['current_password' => ['Текущий пароль указан неверно.']],
                ], 422);
            }

            $user->password = $data['password'];
        }

        if (array_key_exists('name', $data)) {
            $user->name = $data['name'];
        }

        if (array_key_exists('email', $data)) {
            $user->email = $data['email'];
        }

        if (array_key_exists('phone', $data)) {
            $user->phone = $data['phone'];
        }

        $user->save();

        return response()->json([
            'message' => 'Профиль обновлён.',
            'data' => (new UserResource($user->loadCount('orders')))->resolve(),
        ]);
    }

    /**
     * GET /api/profile/orders
     */
    public function orders(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->with(['items.product'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => OrderResource::collection($orders)->resolve(),
        ]);
    }

    /**
     * GET /api/profile/repairs
     */
    public function repairs(Request $request): JsonResponse
    {
        $repairs = RepairRequest::query()
            ->with(['service', 'master', 'slot'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => RepairRequestResource::collection($repairs)->resolve(),
        ]);
    }

    /**
     * GET /api/profile/trade-ins
     */
    public function tradeIns(Request $request): JsonResponse
    {
        $tradeIns = TradeIn::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => TradeInResource::collection($tradeIns)->resolve(),
        ]);
    }

    /**
     * GET /api/profile/bookings
     */
    public function bookings(Request $request): JsonResponse
    {
        $bookings = Booking::query()
            ->with(['product', 'store'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('slot_date')
            ->orderByDesc('slot_time')
            ->get();

        return response()->json([
            'data' => BookingResource::collection($bookings)->resolve(),
        ]);
    }

    /**
     * GET /api/profile/bonuses
     * Баланс бонусов и история начислений (журнал в таблице settings, group = bonus_history).
     */
    public function bonuses(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $history = Setting::query()
            ->where('group', 'bonus_history')
            ->orderByDesc('id')
            ->get()
            ->map(function (Setting $row) {
                $decoded = json_decode((string) $row->value, true);

                return is_array($decoded) ? $decoded : [];
            })
            ->filter(fn (array $row) => ($row['user_id'] ?? null) === $user->id)
            ->values()
            ->map(fn (array $row) => [
                'amount' => (int) ($row['amount'] ?? 0),
                'order_number' => $row['order_number'] ?? null,
                'description' => $row['description'] ?? 'Начисление бонусов',
                'created_at' => $row['created_at'] ?? null,
            ]);

        $percent = (float) (Setting::value('bonus_percent', '2') ?? 2);

        return response()->json([
            'balance' => (int) $user->bonus_points,
            'balance_formatted' => number_format((int) $user->bonus_points, 0, ',', ' ') . ' бонусов',
            'earn_percent' => $percent,
            'max_pay_percent' => 30,
            'history' => $history,
        ]);
    }
}
