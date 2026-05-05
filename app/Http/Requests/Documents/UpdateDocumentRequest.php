<?php

namespace App\Http\Requests\Documents;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'document_type' => ['sometimes', 'required', 'string', 'max:50'],
            'visibility' => ['sometimes', 'required', Rule::in(['public', 'admin', 'private'])],
            'publication_status' => ['sometimes', 'required', Rule::in(['draft', 'published', 'archived'])],
            'published_at' => ['nullable', 'date'],
            'file' => ['nullable', 'file', 'max:10240'],
        ];
    }
}
