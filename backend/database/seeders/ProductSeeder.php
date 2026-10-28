<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            ['Hydrococo 150ml', 12000],
            ['Sabun Mandi Cair 250ml', 18500],
            ['Shampoo Anti Ketombe 170ml', 27000],
            ['Pasta Gigi Mint 120g', 11000],
            ['Sikat Gigi Soft', 8500],
            ['Minyak Goreng 1L', 19000],
            ['Beras Premium 5kg', 72000],
            ['Gula Pasir 1kg', 16500],
            ['Teh Celup 25s', 9500],
            ['Kopi Instan Sachet 10s', 14000],
            ['Susu UHT Coklat 200ml', 6500],
            ['Mie Instan Goreng', 3500],
            ['Biskuit Kelapa 200g', 12500],
            ['Detergen Bubuk 800g', 24000],
            ['Pelembut Pakaian 900ml', 21000],
            ['Tisu Wajah 250s', 15000],
            ['Sabun Cuci Piring 400ml', 11500],
            ['Air Mineral 600ml', 3000],
            ['Kecap Manis 275ml', 13500],
            ['Saus Sambal 340ml', 10500],
        ];

        foreach ($products as $i => [$name, $price]) {
            Product::updateOrCreate(
                ['product_code' => 'P'.str_pad((string) ($i + 1), 4, '0', STR_PAD_LEFT)],
                [
                    'product_name' => $name,
                    'price' => $price,
                    // beberapa produk sengaja stok tipis agar dashboard "stok < 5" punya data
                    'stock' => $i < 3 ? random_int(1, 4) : random_int(30, 150),
                ]
            );
        }
    }
}
