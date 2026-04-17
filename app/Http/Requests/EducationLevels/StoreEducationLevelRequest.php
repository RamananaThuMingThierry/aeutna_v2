<?php

namespace App\Http\Requests\EducationLevels;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEducationLevelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:education_levels,name'],
            'code' => ['nullable', 'string', 'max:255', Rule::unique('education_levels', 'code')->whereNotNull('code')],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
