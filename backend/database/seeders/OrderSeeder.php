<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    public function run(OrderService $orders): void
    {
        // Jangan seed ulang kalau order sudah ada
        if (Order::count() > 0) {
            return;
        }

        $admin = User::where('email', 'admin@azatech.id')->firstOrFail();
        $customerIds = Customer::pluck('id')->all();

        // Stok dinaikkan sementara agar 30 order tidak gagal karena stok habis.
        // Setelah seeding, stok sisa tetap realistis dan 3 produk tetap di bawah 5.
        Product::query()->increment('stock', 200);

        for ($i = 0; $i < 30; $i++) {
            // Tersebar 30 hari terakhir, jam acak
            $date = now()
                ->subDays(29 - $i)
                ->setTime(random_int(8, 20), random_int(0, 59), random_int(0, 59));

            // 1-4 produk berbeda per order
            $productIds = Product::query()
                ->inRandomOrder()
                ->limit(random_int(1, 4))
                ->pluck('id');

            $items = $productIds
                ->map(fn (int $id) => [
                    'product_id' => $id,
                    'quantity' => random_int(1, 5),
                ])
                ->all();

            $orders->create(
                customerId: $customerIds[array_rand($customerIds)],
                items: $items,
                userId: $admin->id,
                orderDate: $date,
            );
        }
        // Setelah seeding: 3 produk pertama stok tipis (< 5) untuk dashboard
        Product::query()->orderBy('id')->limit(3)->get()->each(
            fn (Product $p) => $p->update(['stock' => random_int(1, 4)])
        );
    }
}
