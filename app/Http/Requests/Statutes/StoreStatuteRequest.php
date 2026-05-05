<?php

namespace App\Http\Requests\Statutes;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStatuteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'version' => ['required', 'string', 'max:30'],
            'publication_status' => ['required', Rule::in(['draft', 'validated', 'published', 'archived'])],
            'visibility' => ['required', Rule::in(['public', 'admin', 'private'])],
            'validated_at' => ['nullable', 'date'],
            'effective_at' => ['nullable', 'date'],
            'is_current' => ['nullable', 'boolean'],
            'document_id' => ['nullable', 'integer', 'exists:documents,id'],
        ];
    }
}
