<?php

namespace App\Http\Requests\AnnualFees;

use Illuminate\Foundation\Http\FormRequest;

class StoreAnnualFeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'year' => ['required', 'integer', 'digits:4', 'unique:annual_fees,year'],
            'amount' => ['required', 'numeric', 'min:0'],
            'due_date' => ['nullable', 'date'],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
