<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    public function definition(): array
    {
        return [
            'customer_name' => fake()->name(),
            'customer_address' => fake()->city(),
            'gender' => fake()->randomElement(['Pria', 'Wanita']),
            'birth_date' => fake()->dateTimeBetween('-50 years', '-18 years')->format('Y-m-d'),
            'phone' => fake()->optional(0.8)->numerify('08##########'),
        ];
    }
}
