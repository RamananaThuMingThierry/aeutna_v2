<?php

namespace App\Http\Requests\Axes;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAxeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $axeId = decrypt_to_int_or_null($this->route('encryptedId'));

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('axes', 'name')->ignore($axeId)],
            'code' => ['nullable', 'string', 'max:255', Rule::unique('axes', 'code')->ignore($axeId)->whereNotNull('code')],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
