<?php

declare(strict_types=1);

use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use App\Exceptions\OrderFailedException;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->customer = Customer::factory()->create();
});

it('creates an order successfully and reduces stock', function () {
    Sanctum::actingAs($this->user);
    $p1 = Product::factory()->create(['stock' => 10, 'price' => 12000]);
    $p2 = Product::factory()->create(['stock' => 5, 'price' => 8000]);

    $response = $this->postJson('/api/orders', [
        'customer_id' => $this->customer->id,
        'items' => [
            ['product_id' => $p1->id, 'quantity' => 2],
            ['product_id' => $p2->id, 'quantity' => 1],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.total_amount', '32000.00');

    expect($p1->fresh()->stock)->toBe(8)
        ->and($p2->fresh()->stock)->toBe(4);

    $this->assertDatabaseHas('order_items', [
        'product_id' => $p1->id,
        'unit_price' => '12000.00',
        'subtotal' => '24000.00',
    ]);
});

it('fails with insufficient stock and changes no stock', function () {
    Sanctum::actingAs($this->user);
    $ok = Product::factory()->create(['stock' => 10]);
    $low = Product::factory()->create(['stock' => 3]);

    $this->postJson('/api/orders', [
        'customer_id' => $this->customer->id,
        'items' => [
            ['product_id' => $ok->id, 'quantity' => 2],
            ['product_id' => $low->id, 'quantity' => 5],
        ],
    ])->assertStatus(422)
        ->assertJsonPath('success', false)
        ->assertJsonStructure(['errors' => ['items.1.quantity']]);

    expect($ok->fresh()->stock)->toBe(10)
        ->and($low->fresh()->stock)->toBe(3);
    $this->assertDatabaseCount('orders', 0);
});

it('fails validation with empty items', function () {
    Sanctum::actingAs($this->user);

    $this->postJson('/api/orders', [
        'customer_id' => $this->customer->id,
        'items' => [],
    ])->assertStatus(422)
        ->assertJsonPath('success', false)
        ->assertJsonStructure(['errors' => ['items']]);
});

it('rejects duplicate products in one order', function () {
    Sanctum::actingAs($this->user);
    $p = Product::factory()->create(['stock' => 10]);

    $this->postJson('/api/orders', [
        'customer_id' => $this->customer->id,
        'items' => [
            ['product_id' => $p->id, 'quantity' => 1],
            ['product_id' => $p->id, 'quantity' => 1],
        ],
    ])->assertStatus(422);
});

it('rejects access without token', function () {
    $this->postJson('/api/orders', [])->assertStatus(401);
    $this->getJson('/api/products')->assertStatus(401);
});

it('ignores price and total sent by the client', function () {
    Sanctum::actingAs($this->user);
    $p = Product::factory()->create(['stock' => 10, 'price' => 5000]);

    $this->postJson('/api/orders', [
        'customer_id' => $this->customer->id,
        'items' => [['product_id' => $p->id, 'quantity' => 2, 'price' => 1]],
        'total_amount' => 1,
    ])->assertCreated()
        ->assertJsonPath('data.total_amount', '10000.00');
});
