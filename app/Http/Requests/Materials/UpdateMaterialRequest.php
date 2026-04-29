<?php

namespace App\Http\Requests\Materials;

use App\Models\Material;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateMaterialRequest extends FormRequest
{
    private const CONDITION_STATUSES = ['excellent', 'good', 'fair', 'damaged', 'out_of_service'];

    private const MATERIAL_STATUSES = ['available', 'in_use', 'maintenance', 'lost', 'archived'];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $materialId = decrypt_to_int_or_null($this->route('encryptedId'));

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'reference' => ['nullable', 'string', 'max:255', Rule::unique('materials', 'reference')->ignore($materialId)->whereNotNull('reference')],
            'category' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'quantity_total' => ['sometimes', 'required', 'integer', 'min:0'],
            'quantity_available' => ['sometimes', 'required', 'integer', 'min:0'],
            'condition_status' => ['nullable', Rule::in(self::CONDITION_STATUSES)],
            'status' => ['nullable', Rule::in(self::MATERIAL_STATUSES)],
            'storage_location' => ['nullable', 'string', 'max:255'],
            'acquired_at' => ['nullable', 'date'],
            'acquisition_cost' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $materialId = decrypt_to_int_or_null($this->route('encryptedId'));
            $material = $materialId ? Material::find($materialId) : null;

            $total = $this->has('quantity_total')
                ? $this->input('quantity_total')
                : $material?->quantity_total;

            $available = $this->has('quantity_available')
                ? $this->input('quantity_available')
                : $material?->quantity_available;

            if (is_numeric($total) && is_numeric($available) && (int) $available > (int) $total) {
                $validator->errors()->add(
                    'quantity_available',
                    'La quantite disponible ne peut pas depasser la quantite totale.'
                );
            }
        });
    }
}
