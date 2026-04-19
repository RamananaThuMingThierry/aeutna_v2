<?php

namespace App\Http\Requests\Activities;

use Illuminate\Foundation\Http\FormRequest;

class UpdateActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'status' => ['nullable', 'in:draft,published,cancelled,completed'],
            'images' => ['nullable', 'array'],
            'images.*' => ['image', 'max:2048'],
            'deleted_image_ids' => ['nullable', 'array'],
            'deleted_image_ids.*' => ['integer'],
            'cover_image_id' => ['nullable'],
        ];
    }

    public function messages(): array
    {
        return [
            'images.*.image' => 'Chaque fichier doit etre une image valide.',
            'images.*.max' => 'Chaque image ne doit pas depasser 2 Mo.',
            'images.*.uploaded' => 'Le televersement a echoue. Chaque image ne doit pas depasser 2 Mo.',
        ];
    }
}
