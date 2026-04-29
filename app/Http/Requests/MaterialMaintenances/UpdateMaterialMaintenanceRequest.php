<?php

namespace App\Http\Requests\MaterialMaintenances;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMaterialMaintenanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'material_id' => ['sometimes', 'required', 'integer', 'exists:materials,id'],
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'maintenance_date' => ['nullable', 'date'],
            'status' => ['nullable', Rule::in(['planned', 'in_progress', 'completed', 'cancelled'])],
            'notes' => ['nullable', 'string'],
        ];
    }
}
