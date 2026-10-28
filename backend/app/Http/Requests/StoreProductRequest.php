<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
           'product_code' => ['required', 'string', 'max:20', 'unique:products,product_code'],
            'product_name' => ['required', 'string', 'max:150'],
            'stock' => ['required', 'integer', 'min:0'],
            'price' => ['required', 'numeric', 'gt:0', 'max:9999999999.99'],
        ];
    }
}
