<?php

namespace App\Http\Controllers;

use App\Http\Requests\Statutes\StoreStatuteRequest;
use App\Http\Requests\Statutes\UpdateStatuteRequest;
use App\Models\Statute;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StatuteController extends Controller
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

    private function loadStatute(int $id): Statute
    {
        return Statute::query()
            ->with([
                'document:id,title,file_name,file_path,document_type,visibility,publication_status',
                'titles' => fn ($query) => $query->with([
                    'articles' => fn ($articleQuery) => $articleQuery->orderBy('sort_order')->orderBy('id'),
                ])->orderBy('sort_order')->orderBy('id'),
            ])
            ->withCount('titles')
            ->findOrFail($id);
    }

    private function syncCurrentFlag(bool $isCurrent, ?int $exceptId = null): void
    {
        if (!$isCurrent) {
            return;
        }

        $query = Statute::query();

        if ($exceptId) {
            $query->where('id', '!=', $exceptId);
        }

        $query->update(['is_current' => false]);
    }

    public function index(): JsonResponse
    {
        $statutes = Statute::query()
            ->with('document:id,title,file_name,file_path,document_type,visibility,publication_status')
            ->withCount('titles')
            ->orderByDesc('is_current')
            ->orderByDesc('effective_at')
            ->orderByDesc('id')
            ->get();

        return response()->json($statutes);
    }

    public function show(string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedStatuteId($encryptedId);

        return response()->json([
            'statute' => $this->loadStatute($id),
        ]);
    }

    public function store(StoreStatuteRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $statute = DB::transaction(function () use ($validated) {
            $isCurrent = (bool) ($validated['is_current'] ?? false);
            $this->syncCurrentFlag($isCurrent);

            return Statute::query()->create([
                'title' => $validated['title'],
                'version' => $validated['version'],
                'publication_status' => $validated['publication_status'],
                'visibility' => $validated['visibility'],
                'validated_at' => $validated['validated_at'] ?? null,
                'effective_at' => $validated['effective_at'] ?? null,
                'is_current' => $isCurrent,
                'document_id' => $validated['document_id'] ?? null,
            ]);
        });

        return response()->json([
            'message' => 'Statut cree avec succes.',
            'statute' => $this->loadStatute($statute->id),
        ], 201);
    }

    public function update(UpdateStatuteRequest $request, string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedStatuteId($encryptedId);
        $statute = Statute::query()->findOrFail($id);
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $statute) {
            $isCurrent = array_key_exists('is_current', $validated)
                ? (bool) $validated['is_current']
                : $statute->is_current;

            $this->syncCurrentFlag($isCurrent, $statute->id);

            $statute->update([
                'title' => $validated['title'] ?? $statute->title,
                'version' => $validated['version'] ?? $statute->version,
                'publication_status' => $validated['publication_status'] ?? $statute->publication_status,
                'visibility' => $validated['visibility'] ?? $statute->visibility,
                'validated_at' => array_key_exists('validated_at', $validated) ? $validated['validated_at'] : $statute->validated_at,
                'effective_at' => array_key_exists('effective_at', $validated) ? $validated['effective_at'] : $statute->effective_at,
                'is_current' => $isCurrent,
                'document_id' => array_key_exists('document_id', $validated) ? $validated['document_id'] : $statute->document_id,
            ]);
        });

        return response()->json([
            'message' => 'Statut mis a jour avec succes.',
            'statute' => $this->loadStatute($statute->id),
        ]);
    }

    public function destroy(string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedStatuteId($encryptedId);
        $statute = Statute::query()->findOrFail($id);
        $statute->delete();

        return response()->json([
            'message' => 'Statut supprime avec succes.',
        ]);
    }
}
