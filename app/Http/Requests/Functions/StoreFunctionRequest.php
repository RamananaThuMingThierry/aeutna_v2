<?php

namespace App\Http\Requests\Functions;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFunctionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:functions,name'],
            'code' => ['nullable', 'string', 'max:255', Rule::unique('functions', 'code')->whereNotNull('code')],
            'description' => ['nullable', 'string'],
            'is_executive' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
