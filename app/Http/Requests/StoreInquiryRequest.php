<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInquiryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'interest' => ['required', 'string', Rule::in(['Product Inquiry', 'Branch Visit', 'Wholesale Order', 'Partnership'])],
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'requested_quantity' => ['nullable', 'integer', 'min:1', 'max:1000000'],
            'message' => ['required', 'string', 'min:10', 'max:4000'],
            'website' => ['nullable', 'string', 'max:0'],
        ];
    }
}
