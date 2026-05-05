<?php

namespace App\Http\Requests\StatuteTitles;

use App\Models\StatuteTitle;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStatuteTitleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $titleId = decrypt_to_int_or_null($this->route('encryptedId'));
        $title = $titleId ? StatuteTitle::query()->find($titleId) : null;
        $statuteId = (int) ($this->input('statute_id') ?: $title?->statute_id);

        return [
            'number' => [
                'sometimes',
                'required',
                'string',
                'max:20',
                Rule::unique('statute_titles', 'number')
                    ->ignore($titleId)
                    ->where(fn ($query) => $query->where('statute_id', $statuteId)),
            ],
            'heading' => ['sometimes', 'required', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'statute_id' => ['nullable', 'integer', 'exists:statutes,id'],
        ];
    }
}
