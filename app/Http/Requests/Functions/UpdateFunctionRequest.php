<?php

namespace App\Http\Requests\Functions;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFunctionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $functionId = decrypt_to_int_or_null($this->route('encryptedId'));

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('functions', 'name')->ignore($functionId)],
            'code' => ['nullable', 'string', 'max:255', Rule::unique('functions', 'code')->ignore($functionId)->whereNotNull('code')],
            'description' => ['nullable', 'string'],
            'is_executive' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
