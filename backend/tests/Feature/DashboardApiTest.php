<?php

declare(strict_types=1);

use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use App\Services\OrderService;
use Laravel\Sanctum\Sanctum;

it('returns a correct dashboard summary', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $customer = Customer::factory()->create();
    $p1 = Product::factory()->create(['stock' => 20, 'price' => 10000]);
    $p2 = Product::factory()->create(['stock' => 3, 'price' => 5000]);

    $service = app(OrderService::class);
    $service->create($customer->id, [['product_id' => $p1->id, 'quantity' => 2]], $user->id);
    $service->create($customer->id, [
        ['product_id' => $p1->id, 'quantity' => 1],
        ['product_id' => $p2->id, 'quantity' => 1],
    ], $user->id);

    $this->getJson('/api/dashboard/summary')
        ->assertOk()
        ->assertJsonPath('data.total_orders', 2)
        ->assertJsonPath('data.total_sales', '35000.00')
        ->assertJsonPath('data.top_products.0.id', $p1->id)
        ->assertJsonPath('data.top_products.0.total_sold', 3)
        ->assertJsonCount(1, 'data.low_stock_products')
        ->assertJsonPath('data.low_stock_products.0.id', $p2->id);
});

it('requires authentication for the dashboard', function () {
    $this->getJson('/api/dashboard/summary')->assertStatus(401);
});
