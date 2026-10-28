<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\OrderFailedException;
use App\Models\Order;
use App\Models\Product;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

class OrderService
{
    /**
     * @param  array<int, array{product_id: int, quantity: int}>  $items
     */
    public function create(
        string $customerId,
        array $items,
        int $userId,
        ?CarbonInterface $orderDate = null,
    ): Order {
        $orderDate ??= now();

        return DB::transaction(function () use ($customerId, $items, $userId, $orderDate) {
            // 1. Kunci baris produk (urut by id agar tidak deadlock)
            $products = Product::query()
                ->whereIn('id', collect($items)->pluck('product_id'))
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            // 2. Validasi stok semua item, kumpulkan semua error
            $errors = [];
            foreach ($items as $i => $item) {
                $product = $products->get($item['product_id']);

                if ($product === null) {
                    $errors["items.$i.product_id"] = ['Produk tidak ditemukan'];
                } elseif ($product->stock < $item['quantity']) {
                    $errors["items.$i.quantity"] = [
                        "Stok {$product->product_name} tersisa {$product->stock}, diminta {$item['quantity']}",
                    ];
                }
            }

            if ($errors !== []) {
                throw new OrderFailedException($errors);
            }

            // 3. Buat order
            $order = Order::create([
                'order_number' => $this->generateOrderNumber($orderDate),
                'customer_id' => $customerId,
                'created_by' => $userId,
                'order_date' => $orderDate,
                'total_amount' => 0,
            ]);

            // 4. Buat item, hitung subtotal di server, kurangi stok
            $total = '0.00';
            foreach ($items as $item) {
                $product = $products->get($item['product_id']);
                $subtotal = bcmul((string) $product->price, (string) $item['quantity'], 2);

                $order->items()->create([
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $product->price,
                    'subtotal' => $subtotal,
                ]);

                $product->decrement('stock', $item['quantity']);
                $total = bcadd($total, $subtotal, 2);
            }

            // 5. Simpan total
            $order->update(['total_amount' => $total]);

            return $order->load('items.product', 'customer');
        });
    }

    private function generateOrderNumber(CarbonInterface $date): string
    {
        $prefix = 'INV-'.$date->format('Ymd').'-';

        // Kunci per hari agar dua request bersamaan tidak dapat nomor sama
        if (DB::getDriverName() === 'pgsql') {
            DB::select('select pg_advisory_xact_lock(?)', [crc32($prefix)]);
        }

        $last = Order::where('order_number', 'like', $prefix.'%')->max('order_number');
        $next = $last ? ((int) substr($last, -4)) + 1 : 1;

        return $prefix.str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
