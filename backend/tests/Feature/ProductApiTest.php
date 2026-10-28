<?php

declare(strict_types=1);

use App\Models\Product;
use App\Models\Customer;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    Sanctum::actingAs(User::factory()->create());
});

function productPayload(array $overrides = []): array
{
    return array_merge(['product_name' => 'Tes', 'stock' => 5, 'price' => 1000], $overrides);
}

it('generates product code automatically', function () {
    Product::factory()->create(['product_code' => 'P0020']);

    $this->postJson('/api/products', productPayload())
        ->assertCreated()
        ->assertJsonPath('data.product_code', 'P0021');
});

it('never reuses the code of a deleted product', function () {
    Product::factory()->create(['product_code' => 'P0020']);

    $first = $this->postJson('/api/products', productPayload())->json('data');
    $this->deleteJson('/api/products/'.$first['id'])->assertOk();

    $this->postJson('/api/products', productPayload())
        ->assertCreated()
        ->assertJsonPath('data.product_code', 'P0022');
});

it('rejects invalid product input', function () {
    Product::factory()->create(['product_code' => 'P0001']);

    $this->postJson('/api/products', [
        'product_code' => 'P0001',
        'product_name' => 'Tes',
        'stock' => -1,
        'price' => 0,
    ])->assertStatus(422)
        ->assertJsonPath('success', false)
        ->assertJsonStructure(['errors' => ['product_code', 'stock', 'price']]);
});

it('lists products with search, sort and pagination', function () {
    Product::factory()->create(['product_name' => 'Sabun A', 'price' => 5000]);
    Product::factory()->create(['product_name' => 'Sabun B', 'price' => 9000]);
    Product::factory()->create(['product_name' => 'Beras', 'price' => 7000]);

    $this->getJson('/api/products?search=sabun&sort=-price&per_page=1')
        ->assertOk()
        ->assertJsonPath('meta.total', 2)
        ->assertJsonPath('meta.total_pages', 2)
        ->assertJsonPath('data.0.product_name', 'Sabun B');
});

it('keeps order history after a product is soft deleted', function () {
    $customer = Customer::factory()->create();
    $product = Product::factory()->create(['product_name' => 'Sabun Tes', 'stock' => 10, 'price' => 5000]);

    $orderId = $this->postJson('/api/orders', [
        'customer_id' => $customer->id,
        'items' => [['product_id' => $product->id, 'quantity' => 2]],
    ])->assertCreated()->json('data.id');

    $this->deleteJson("/api/products/{$product->id}")->assertOk();

    $this->assertSoftDeleted('products', ['id' => $product->id]);
    $this->getJson("/api/products/{$product->id}")->assertNotFound();
    $this->getJson("/api/orders/{$orderId}")
        ->assertOk()
        ->assertJsonPath('data.items.0.product_name', 'Sabun Tes');
});
