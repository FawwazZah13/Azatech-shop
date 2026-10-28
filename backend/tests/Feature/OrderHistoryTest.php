<?php

declare(strict_types=1);

use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;

it('filters order history by date range and customer', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $a = Customer::factory()->create();
    $b = Customer::factory()->create();
    $product = Product::factory()->create(['stock' => 100]);
    $service = app(OrderService::class);
    $item = [['product_id' => $product->id, 'quantity' => 1]];

    $service->create($a->id, $item, $user->id, Carbon::parse('2026-10-01 10:00'));
    $service->create($a->id, $item, $user->id, Carbon::parse('2026-10-20 10:00'));
    $service->create($b->id, $item, $user->id, Carbon::parse('2026-10-20 15:00'));

    $this->getJson('/api/orders?from=2026-10-10&to=2026-10-25')
        ->assertOk()->assertJsonPath('meta.total', 2);
    $this->getJson("/api/orders?customer_id={$a->id}")
        ->assertOk()->assertJsonPath('meta.total', 2);
    $this->getJson("/api/orders?from=2026-10-10&customer_id={$a->id}")
        ->assertOk()->assertJsonPath('meta.total', 1);
    $this->getJson('/api/orders?from=2026-10-25&to=2026-10-10')
        ->assertStatus(422);
});

it('keeps the unit price snapshot when the product price changes later', function () {
    Sanctum::actingAs(User::factory()->create());
    $customer = Customer::factory()->create();
    $product = Product::factory()->create(['stock' => 10, 'price' => 5000]);

    $orderId = $this->postJson('/api/orders', [
        'customer_id' => $customer->id,
        'items' => [['product_id' => $product->id, 'quantity' => 2]],
    ])->assertCreated()->json('data.id');

    $this->putJson("/api/products/{$product->id}", [
        'product_code' => $product->product_code,
        'product_name' => $product->product_name,
        'stock' => 8,
        'price' => 9000,
    ])->assertOk();

    $this->getJson("/api/orders/{$orderId}")
        ->assertOk()
        ->assertJsonPath('data.items.0.unit_price', '5000.00')
        ->assertJsonPath('data.total_amount', '10000.00');
});
