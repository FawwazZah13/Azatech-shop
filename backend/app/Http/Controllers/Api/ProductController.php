<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    private const SORTABLE = [
        'name' => 'product_name',
        'price' => 'price',
        'stock' => 'stock',
    ];

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'sort' => ['sometimes', 'string', 'in:name,price,stock,-name,-price,-stock'],
        ]);

        $perPage = (int) $request->input('per_page', 10);
        $sort = (string) $request->input('sort', 'name');
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $column = self::SORTABLE[ltrim($sort, '-')];

        $paginator = Product::query()
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->input('search').'%';
                $q->where(fn ($w) => $w
                    ->where('product_name', 'ilike', $term)
                    ->orWhere('product_code', 'ilike', $term));
            })
            ->orderBy($column, $direction)
            ->orderBy('id')
            ->paginate($perPage);

        return ApiResponse::success(
            ProductResource::collection($paginator->items()),
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

    public function show(Product $product): JsonResponse
    {
        return ApiResponse::success(new ProductResource($product));
    }

    public function store(StoreProductRequest $request, ProductService $product): JsonResponse
    {
        $product = $product->create($request->validated());

        return ApiResponse::success(new ProductResource($product), 'Produk berhasil dibuat', 201);
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $product->update($request->validated());

        return ApiResponse::success(new ProductResource($product), 'Produk berhasil diperbarui');
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return ApiResponse::success(null, 'Produk berhasil dihapus');
    }
}
