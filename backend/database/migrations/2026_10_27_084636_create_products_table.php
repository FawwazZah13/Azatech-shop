<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('product_code', 20)->unique();
            $table->string('product_name', 150);
            $table->unsignedInteger('stock')->default(0);
            $table->decimal('price', 12, 2);
            $table->timestamps();
            $table->softDeletes();

            $table->index('product_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
