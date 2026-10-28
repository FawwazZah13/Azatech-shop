<?php

declare(strict_types=1);

use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    Sanctum::actingAs(User::factory()->create());
});

it('creates a customer with a uuid', function () {
    $response = $this->postJson('/api/customers', [
        'customer_name' => 'Budi Santoso',
        'customer_address' => 'Jakarta',
        'gender' => 'Pria',
        'birth_date' => '1995-02-10',
        'phone' => '081234567890',
    ])->assertCreated();

    expect($response->json('data.id'))->toMatch('/^[0-9a-f-]{36}$/');
});

it('rejects invalid customer input', function () {
    $this->postJson('/api/customers', [
        'customer_name' => '',
        'gender' => 'Lainnya',
        'birth_date' => '2999-01-01',
    ])->assertStatus(422)
        ->assertJsonStructure(['errors' => ['customer_name', 'customer_address', 'gender', 'birth_date']]);
});

it('searches customers by name case-insensitively', function () {
    Customer::factory()->create(['customer_name' => 'Budi Santoso']);
    Customer::factory()->create(['customer_name' => 'Siti Aminah']);

    $this->getJson('/api/customers?search=BUDI')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.customer_name', 'Budi Santoso');
});

it('allows clearing the phone number on update', function () {
    $customer = Customer::factory()->create(['phone' => '081234567890']);

    $this->putJson("/api/customers/{$customer->id}", [
        'customer_name' => $customer->customer_name,
        'customer_address' => $customer->customer_address,
        'gender' => $customer->gender,
        'birth_date' => $customer->birth_date->format('Y-m-d'),
        'phone' => null,
    ])->assertOk();

    expect($customer->fresh()->phone)->toBeNull();
});

it('soft deletes a customer and blocks new orders for them', function () {
    $customer = Customer::factory()->create();
    $product = Product::factory()->create(['stock' => 10]);

    $this->deleteJson("/api/customers/{$customer->id}")->assertOk();

    $this->assertSoftDeleted('customers', ['id' => $customer->id]);
    $this->getJson("/api/customers/{$customer->id}")->assertNotFound();

    $this->postJson('/api/orders', [
        'customer_id' => $customer->id,
        'items' => [['product_id' => $product->id, 'quantity' => 1]],
    ])->assertStatus(422)
        ->assertJsonStructure(['errors' => ['customer_id']]);

    expect($product->fresh()->stock)->toBe(10);
});
