<?php

namespace App\Http\Requests\EducationLevels;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEducationLevelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $educationLevelId = decrypt_to_int_or_null($this->route('encryptedId'));

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('education_levels', 'name')->ignore($educationLevelId)],
            'code' => ['nullable', 'string', 'max:255', Rule::unique('education_levels', 'code')->ignore($educationLevelId)->whereNotNull('code')],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
