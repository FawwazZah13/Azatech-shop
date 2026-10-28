<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\DB;

class ProductService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Product
    {
        return DB::transaction(function () use ($data) {
            if (empty($data['product_code'])) {
                // Kunci agar dua request bersamaan tidak mendapat kode yang sama
                if (DB::getDriverName() === 'pgsql') {
                    DB::select('select pg_advisory_xact_lock(?)', [crc32('product_code')]);
                }

                $data['product_code'] = $this->nextCode();
            }

            return Product::create($data);
        });
    }

    private function nextCode(): string
    {
        $last = Product::withTrashed()
            ->whereRaw("product_code ~ '^P[0-9]+$'")
            ->orderByRaw('CAST(SUBSTRING(product_code FROM 2) AS INTEGER) DESC')
            ->value('product_code');

        $next = $last ? ((int) substr($last, 1)) + 1 : 1;

        return 'P' . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
