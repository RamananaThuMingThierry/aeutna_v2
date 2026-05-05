<?php

namespace App\Http\Controllers;

use App\Http\Requests\StatuteTitles\StoreStatuteTitleRequest;
use App\Http\Requests\StatuteTitles\UpdateStatuteTitleRequest;
use App\Models\Statute;
use App\Models\StatuteTitle;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class StatuteTitleController extends Controller
{
    private function resolveEncryptedStatuteId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant statut invalide.'],
            ]);
        }

        return $id;
    }

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

    public function store(StoreStatuteTitleRequest $request, string $encryptedId): JsonResponse
    {
        $statuteId = $this->resolveEncryptedStatuteId($encryptedId);
        Statute::query()->findOrFail($statuteId);
        $validated = $request->validated();

        $title = StatuteTitle::query()->create([
            'statute_id' => $statuteId,
            'number' => $validated['number'],
            'heading' => $validated['heading'],
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        return response()->json([
            'message' => 'Titre ajoute avec succes.',
            'title' => $title->fresh(['articles']),
        ], 201);
    }

    public function update(UpdateStatuteTitleRequest $request, string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedTitleId($encryptedId);
        $title = StatuteTitle::query()->findOrFail($id);
        $validated = $request->validated();

        $title->update([
            'statute_id' => $validated['statute_id'] ?? $title->statute_id,
            'number' => $validated['number'] ?? $title->number,
            'heading' => $validated['heading'] ?? $title->heading,
            'sort_order' => array_key_exists('sort_order', $validated) ? $validated['sort_order'] : $title->sort_order,
        ]);

        return response()->json([
            'message' => 'Titre mis a jour avec succes.',
            'title' => $title->fresh(['articles']),
        ]);
    }

    public function destroy(string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedTitleId($encryptedId);
        $title = StatuteTitle::query()->findOrFail($id);
        $title->delete();

        return response()->json([
            'message' => 'Titre supprime avec succes.',
        ]);
    }
}
