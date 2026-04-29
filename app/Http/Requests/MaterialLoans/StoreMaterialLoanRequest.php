<?php

namespace App\Http\Requests\MaterialLoans;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMaterialLoanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'material_id' => ['required', 'integer', 'exists:materials,id'],
            'member_id' => ['nullable', 'integer', 'exists:members,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'loaned_at' => ['required', 'date'],
            'expected_return_at' => ['nullable', 'date', 'after_or_equal:loaned_at'],
            'returned_at' => ['nullable', 'date', 'after_or_equal:loaned_at'],
            'status' => ['nullable', Rule::in(['ongoing', 'returned', 'late', 'lost', 'cancelled'])],
            'notes' => ['nullable', 'string'],
            'approved_by' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}
