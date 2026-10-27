<?php

declare(strict_types=1);

namespace App\Exceptions;

use RuntimeException;

class OrderFailedException extends RuntimeException
{
    /**
     * @param  array<string, array<int, string>>  $errors
     */
    public function __construct(
        public readonly array $errors,
        string $message = 'Stok tidak mencukupi',
    ) {
        parent::__construct($message);
    }
}
