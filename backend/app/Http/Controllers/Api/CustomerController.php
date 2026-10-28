<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
        ]);

        $paginator = Customer::query()
            ->when($request->filled('search'), fn ($q) => $q->where(
                'customer_name', 'ilike', '%'.$request->input('search').'%'
            ))
            ->orderBy('customer_name')
            ->orderBy('id')
            ->paginate((int) $request->input('per_page', 10));

        return ApiResponse::success(
            CustomerResource::collection($paginator->items()),
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

    public function show(Customer $customer): JsonResponse
    {
        return ApiResponse::success(new CustomerResource($customer));
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $customer = Customer::create($request->validated());

        return ApiResponse::success(new CustomerResource($customer), 'Pelanggan berhasil dibuat', 201);
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): JsonResponse
    {
        $customer->update($request->validated());

        return ApiResponse::success(new CustomerResource($customer), 'Pelanggan berhasil diperbarui');
    }

    public function destroy(Customer $customer): JsonResponse
    {
        $customer->delete();

        return ApiResponse::success(null, 'Pelanggan berhasil dihapus');
    }
}
