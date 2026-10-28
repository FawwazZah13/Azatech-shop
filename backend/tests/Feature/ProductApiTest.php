<?php

declare(strict_types=1);

use App\Models\Product;
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
    $this->deleteJson('/api/products/' . $first['id'])->assertOk();

    $this->postJson('/api/products', productPayload())
        ->assertCreated()
        ->assertJsonPath('data.product_code', 'P0022');
});
