<?php

namespace App\Http\Controllers;

use App\Http\Requests\StatuteArticles\StoreStatuteArticleRequest;
use App\Http\Requests\StatuteArticles\UpdateStatuteArticleRequest;
use App\Models\StatuteArticle;
use App\Models\StatuteTitle;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class StatuteArticleController extends Controller
{
    private function resolveEncryptedTitleId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant titre invalide.'],
            ]);
        }

        return $id;
    }

    private function resolveEncryptedArticleId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant article invalide.'],
            ]);
        }

        return $id;
    }

    public function store(StoreStatuteArticleRequest $request, string $encryptedId): JsonResponse
    {
        $titleId = $this->resolveEncryptedTitleId($encryptedId);
        StatuteTitle::query()->findOrFail($titleId);
        $validated = $request->validated();

        $article = StatuteArticle::query()->create([
            'statute_title_id' => $titleId,
            'article_number' => $validated['article_number'],
            'title' => $validated['title'] ?? null,
            'content' => $validated['content'],
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        return response()->json([
            'message' => 'Article ajoute avec succes.',
            'article' => $article,
        ], 201);
    }

    public function update(UpdateStatuteArticleRequest $request, string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedArticleId($encryptedId);
        $article = StatuteArticle::query()->findOrFail($id);
        $validated = $request->validated();

        $article->update([
            'statute_title_id' => $validated['statute_title_id'] ?? $article->statute_title_id,
            'article_number' => $validated['article_number'] ?? $article->article_number,
            'title' => array_key_exists('title', $validated) ? $validated['title'] : $article->title,
            'content' => $validated['content'] ?? $article->content,
            'sort_order' => array_key_exists('sort_order', $validated) ? $validated['sort_order'] : $article->sort_order,
        ]);

        return response()->json([
            'message' => 'Article mis a jour avec succes.',
            'article' => $article,
        ]);
    }

    public function destroy(string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedArticleId($encryptedId);
        $article = StatuteArticle::query()->findOrFail($id);
        $article->delete();

        return response()->json([
            'message' => 'Article supprime avec succes.',
        ]);
    }
}
