<?php

use App\Http\Controllers\Api\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\Admin\LeadController as AdminLeadController;
use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\Admin\RepairController as AdminRepairController;
use App\Http\Controllers\Api\Admin\ReviewController as AdminReviewController;
use App\Http\Controllers\Api\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Api\Admin\SlotController as AdminSlotController;
use App\Http\Controllers\Api\Admin\StoreController as AdminStoreController;
use App\Http\Controllers\Api\Admin\TradeInController as AdminTradeInController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\RepairController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\TradeInController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API маршруты EKlimiks (Laravel 11)
|--------------------------------------------------------------------------
|
| Все маршруты автоматически получают префикс /api (bootstrap/app.php).
| Группы доступа:
|   - публичные            — каталог, услуги, слоты, лиды, оценка Trade-In
|   - auth:sanctum         — личный кабинет, корзина, заказы, записи
|   - admin (роль admin)   — админ-панель, полный доступ
|   - staff (admin+manager)— операционные разделы (заказы, заявки, лиды)
|
*/

// ---------------------------------------------------------------------
// Публичные маршруты (гость)
// ---------------------------------------------------------------------
Route::post('auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::get('categories', [CategoryController::class, 'index']);
Route::get('categories/{slug}', [CategoryController::class, 'show']);

Route::get('products', [ProductController::class, 'index']);
Route::get('products/{slug}', [ProductController::class, 'show']);
Route::get('products/{slug}/reviews', [ProductController::class, 'reviews']);

Route::get('reviews', [ReviewController::class, 'index']);

Route::get('repair-services', [RepairController::class, 'services']);
Route::get('masters', [RepairController::class, 'masters']);
Route::get('masters/{master}/slots', [RepairController::class, 'masterSlots']);

Route::get('stores', [BookingController::class, 'stores']);
Route::get('stores/{store}/slots', [BookingController::class, 'storeSlots']);
Route::get('booking-slots', [BookingController::class, 'slots']);

Route::post('trade-in/estimate', [TradeInController::class, 'estimate'])->middleware('throttle:30,1');
Route::get('settings/public', [SettingController::class, 'public']);

Route::post('leads', [LeadController::class, 'store'])->middleware('throttle:10,1');
Route::get('leads/types', [LeadController::class, 'types']);

// Заявку на ремонт может оставить и незарегистрированный клиент
Route::post('repair-requests', [RepairController::class, 'store'])->middleware('throttle:10,1');

// ---------------------------------------------------------------------
// Авторизованные маршруты (Sanctum)
// ---------------------------------------------------------------------
Route::middleware('auth:sanctum')->group(function () {
    // Аутентификация
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    // Личный кабинет
    Route::get('profile', [ProfileController::class, 'show']);
    Route::put('profile', [ProfileController::class, 'update']);
    Route::patch('profile', [ProfileController::class, 'update']);
    Route::get('profile/orders', [ProfileController::class, 'orders']);
    Route::get('profile/repairs', [ProfileController::class, 'repairs']);
    Route::get('profile/trade-ins', [ProfileController::class, 'tradeIns']);
    Route::get('profile/bookings', [ProfileController::class, 'bookings']);
    Route::get('profile/bonuses', [ProfileController::class, 'bonuses']);

    // Корзина (серверная, хранится в сессии пользователя)
    Route::get('cart', [CartController::class, 'index']);
    Route::post('cart', [CartController::class, 'store']);
    Route::put('cart', [CartController::class, 'update']);
    Route::delete('cart', [CartController::class, 'clear']);
    Route::delete('cart/{product}', [CartController::class, 'destroy'])->whereNumber('product');

    // Избранное
    Route::get('favorites', [FavoriteController::class, 'index']);
    Route::post('favorites', [FavoriteController::class, 'store']);
    Route::delete('favorites/{product}', [FavoriteController::class, 'destroy'])->whereNumber('product');

    // Заказы
    Route::post('orders', [OrderController::class, 'store']);
    Route::get('orders/{number}', [OrderController::class, 'show'])->where('number', '[A-Za-z0-9\-]+');

    // Бронирование визита в магазин
    Route::post('bookings', [BookingController::class, 'store']);
    Route::get('profile/bookings', [BookingController::class, 'myBookings']);

    // Отзывы
    Route::post('reviews', [ReviewController::class, 'store']);
});

// ---------------------------------------------------------------------
// Админ-панель: /api/admin/*
// ---------------------------------------------------------------------
Route::middleware(['auth:sanctum', 'staff'])->prefix('admin')->group(function () {
    Route::get('dashboard', [AdminDashboardController::class, 'index']);

    // Операционные разделы: заказы, заявки, Trade-In, лиды, отзывы, слоты
    Route::apiResource('orders', AdminOrderController::class);
    Route::patch('orders/{order}/status', [AdminOrderController::class, 'updateStatus']);

    Route::apiResource('repair-requests', AdminRepairController::class);
    Route::patch('repair-requests/{repair_request}/status', [AdminRepairController::class, 'updateStatus']);
    Route::get('repair-masters', [AdminRepairController::class, 'masters']);

    Route::apiResource('trade-ins', AdminTradeInController::class);
    Route::patch('trade-ins/{trade_in}/status', [AdminTradeInController::class, 'updateStatus']);
    Route::post('trade-ins-recalculate', [AdminTradeInController::class, 'recalculate']);

    Route::apiResource('leads', AdminLeadController::class)->only(['index', 'show', 'update', 'destroy']);

    Route::apiResource('reviews', AdminReviewController::class);
    Route::patch('reviews/{review}/approve', [AdminReviewController::class, 'approve']);

    Route::post('master-slots/generate', [AdminSlotController::class, 'generate']);
    Route::patch('master-slots/{master_slot}/toggle', [AdminSlotController::class, 'toggle']);
    Route::apiResource('master-slots', AdminSlotController::class)->parameters(['master-slots' => 'masterSlot']);

    Route::apiResource('stores', AdminStoreController::class);

    // Только полный администратор
    Route::middleware('admin')->group(function () {
        Route::patch('products/{product}/toggle', [AdminProductController::class, 'toggle']);
        Route::apiResource('products', AdminProductController::class);
        Route::apiResource('categories', AdminCategoryController::class);
        Route::apiResource('users', AdminUserController::class);

        Route::patch('settings', [AdminSettingController::class, 'bulkUpdate']);
        Route::apiResource('settings', AdminSettingController::class)->except(['create', 'edit']);
    });
});

// ---------------------------------------------------------------------
// Запасной маршрут: неизвестный эндпоинт API
// ---------------------------------------------------------------------
Route::fallback(function () {
    return response()->json([
        'message' => 'Запрашиваемый эндпоинт API не найден.',
    ], 404);
});
