<?php

namespace App\Http\Requests\MaterialMovements;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMaterialMovementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'material_id' => ['sometimes', 'required', 'integer', 'exists:materials,id'],
            'material_loan_id' => ['nullable', 'integer', 'exists:material_loans,id'],
            'movement_type' => ['sometimes', 'required', Rule::in(['entry', 'exit', 'loan', 'return', 'adjustment', 'loss', 'maintenance'])],
            'quantity' => ['sometimes', 'required', 'integer', 'min:1'],
            'movement_date' => ['nullable', 'date'],
            'source_location' => ['nullable', 'string', 'max:255'],
            'destination_location' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
