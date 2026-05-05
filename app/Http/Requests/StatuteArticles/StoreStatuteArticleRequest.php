<?php

namespace App\Http\Requests\StatuteArticles;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStatuteArticleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'statute_title_id' => ['required', 'integer', 'exists:statute_titles,id'],
            'article_number' => [
                'required',
                'string',
                'max:20',
                Rule::unique('statute_articles', 'article_number')->where(
                    fn ($query) => $query->where('statute_title_id', (int) $this->input('statute_title_id'))
                ),
            ],
            'title' => ['nullable', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
