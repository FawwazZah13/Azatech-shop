<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function summary(): JsonResponse
    {
        $totalOrders = Order::count();
        $totalSales = (string) Order::sum('total_amount');

        $topProducts = OrderItem::query()
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->selectRaw('products.id, products.product_code, products.product_name, SUM(order_items.quantity) as total_sold')
            ->groupBy('products.id', 'products.product_code', 'products.product_name')
            ->orderByDesc('total_sold')
            ->orderBy('products.id')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'id' => $row->id,
                'product_code' => $row->product_code,
                'product_name' => $row->product_name,
                'total_sold' => (int) $row->total_sold,
            ]);

        $lowStock = Product::query()
            ->where('stock', '<', 5)
            ->orderBy('stock')
            ->orderBy('id')
            ->get(['id', 'product_code', 'product_name', 'stock']);

        return ApiResponse::success([
            'total_orders' => $totalOrders,
            'total_sales' => number_format((float) $totalSales, 2, '.', ''),
            'top_products' => $topProducts,
            'low_stock_products' => $lowStock,
        ]);
    }
}
