<?php

namespace App\Http\Requests\StatuteTitles;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStatuteTitleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'number' => [
                'required',
                'string',
                'max:20',
                Rule::unique('statute_titles', 'number')->where(
                    fn ($query) => $query->where('statute_id', (int) $this->input('statute_id'))
                ),
            ],
            'heading' => ['required', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'statute_id' => ['required', 'integer', 'exists:statutes,id'],
        ];
    }
}
