<?php

namespace App\Http\Requests\StatuteArticles;

use App\Models\StatuteArticle;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStatuteArticleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $articleId = decrypt_to_int_or_null($this->route('encryptedId'));
        $article = $articleId ? StatuteArticle::query()->find($articleId) : null;
        $titleId = (int) ($this->input('statute_title_id') ?: $article?->statute_title_id);

        return [
            'statute_title_id' => ['nullable', 'integer', 'exists:statute_titles,id'],
            'article_number' => [
                'sometimes',
                'required',
                'string',
                'max:20',
                Rule::unique('statute_articles', 'article_number')
                    ->ignore($articleId)
                    ->where(fn ($query) => $query->where('statute_title_id', $titleId)),
            ],
            'title' => ['nullable', 'string', 'max:255'],
            'content' => ['sometimes', 'required', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
