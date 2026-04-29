<?php

namespace App\Http\Requests\MaterialLoans;

use Illuminate\Foundation\Http\FormRequest;

class ReturnMaterialLoanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'returned_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
