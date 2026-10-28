<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'from' => ['sometimes', 'nullable', 'date'],
            'to' => ['sometimes', 'nullable', 'date', 'after_or_equal:from'],
            'customer_id' => ['sometimes', 'nullable', 'uuid'],
        ]);

        $paginator = Order::query()
            ->with('customer')
            ->when($request->filled('from'), fn ($q) => $q->where('order_date', '>=', $request->date('from')->startOfDay()))
            ->when($request->filled('to'), fn ($q) => $q->where('order_date', '<=', $request->date('to')->endOfDay()))
            ->when($request->filled('customer_id'), fn ($q) => $q->where('customer_id', $request->input('customer_id')))
            ->orderByDesc('order_date')
            ->orderByDesc('id')
            ->paginate((int) $request->input('per_page', 10));

        return ApiResponse::success(
            OrderResource::collection($paginator->items()),
            'OK',
            200,
            [
                'page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'total_pages' => $paginator->lastPage(),
            ],
        );
    }

    public function show(Order $order): JsonResponse
    {
        $order->load('customer', 'creator', 'items.product');

        return ApiResponse::success(new OrderResource($order));
    }

    public function store(StoreOrderRequest $request, OrderService $orders): JsonResponse
    {
        $data = $request->validated();

        $order = $orders->create(
            customerId: $data['customer_id'],
            items: $data['items'],
            userId: $request->user()->id,
        );

        $order->load('creator');

        return ApiResponse::success(new OrderResource($order), 'Order berhasil dibuat', 201);
    }
}
