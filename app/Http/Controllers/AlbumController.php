<?php

namespace App\Http\Controllers;

use App\Http\Requests\Albums\StoreAlbumRequest;
use App\Http\Requests\Albums\UpdateAlbumRequest;
use App\Models\Album;
use App\Models\AlbumImage;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class AlbumController extends Controller
{
    public function __construct(
        private ActivityLogService $activityLogService
    ) {}

    private function resolveEncryptedAlbumId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant album invalide.'],
            ]);
        }

        return $id;
    }

    private function normalizeSlug(string $title, ?string $slug = null): string
    {
        $base = Str::slug($slug ?: $title);

        return $base !== '' ? $base : Str::lower(Str::random(12));
    }

    private function uploadImage($file): string
    {
        $directory = public_path('uploads/albums');

        if (!File::exists($directory)) {
            File::makeDirectory($directory, 0755, true);
        }

        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $file->move($directory, $filename);

        return 'uploads/albums/' . $filename;
    }

    private function deleteImageFile(?string $imageUrl): void
    {
        if (!$imageUrl || !str_starts_with($imageUrl, 'uploads/albums/')) {
            return;
        }

        $path = public_path($imageUrl);

        if (File::exists($path)) {
            File::delete($path);
        }
    }

    private function parseExistingImages(?string $payload): array
    {
        if (!$payload) {
            return [];
        }

        $decoded = json_decode($payload, true);

        return is_array($decoded) ? $decoded : [];
    }

    private function syncAlbumImages(Album $album, Request $request, array $validated): void
    {
        $deletedIds = collect($validated['deleted_image_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->all();

        if (!empty($deletedIds)) {
            $imagesToDelete = $album->images()->whereIn('id', $deletedIds)->get();

            foreach ($imagesToDelete as $image) {
                $this->deleteImageFile($image->image_url);
                $image->delete();
            }
        }

        $existingImages = collect($this->parseExistingImages($request->input('existing_images')))
            ->filter(fn ($item) => is_array($item) && !empty($item['id']));

        foreach ($existingImages as $imageData) {
            $image = $album->images()->whereKey((int) $imageData['id'])->first();

            if (!$image) {
                continue;
            }

            $image->update([
                'name' => $imageData['name'] ?? null,
                'description' => $imageData['description'] ?? null,
                'position' => isset($imageData['position']) ? (int) $imageData['position'] : 0,
                'status' => in_array(($imageData['status'] ?? 'active'), ['active', 'inactive'], true) ? $imageData['status'] : 'active',
            ]);
        }

        $currentMaxPosition = (int) ($album->images()->max('position') ?? -1);

        foreach ($request->file('images', []) as $index => $file) {
            $album->images()->create([
                'image_url' => $this->uploadImage($file),
                'name' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                'description' => null,
                'position' => $currentMaxPosition + $index + 1,
                'status' => 'active',
            ]);
        }
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $query = Album::query()->with(['images']);

            if ($request->filled('status')) {
                $query->where('status', $request->string('status')->toString());
            }

            return response()->json($query->latest()->get());
        } catch (Throwable $exception) {
            $this->activityLogService->logError($request, 'albums_index_error', 'Erreur lors de la consultation des albums.', $exception, $request->user(), Album::class);
            throw $exception;
        }
    }

    public function show(Request $request, string $encryptedId): JsonResponse
    {
        $id = null;

        try {
            $id = $this->resolveEncryptedAlbumId($encryptedId);
            $album = Album::query()->with(['images'])->findOrFail($id);

            return response()->json([
                'album' => $album,
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning($request, 'albums_show_validation_failed', 'Echec de validation lors de la consultation d un album.', $request->user(), Album::class, null, 422, ['errors' => $exception->errors()]);
            throw $exception;
        } catch (Throwable $exception) {
            $this->activityLogService->logError($request, 'albums_show_error', 'Erreur lors de la consultation d un album.', $exception, $request->user(), Album::class, $id);
            throw $exception;
        }
    }

    public function store(StoreAlbumRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();

            $album = DB::transaction(function () use ($request, $validated) {
                $album = Album::query()->create([
                    'title' => $validated['title'],
                    'slug' => $this->normalizeSlug($validated['title'], $validated['slug'] ?? null),
                    'description' => $validated['description'] ?? null,
                    'status' => $validated['status'] ?? 'active',
                ]);

                $this->syncAlbumImages($album, $request, $validated);

                return $album->load(['images']);
            });

            return response()->json([
                'message' => 'Album cree avec succes.',
                'album' => $album,
            ], 201);
        } catch (Throwable $exception) {
            $this->activityLogService->logError($request, 'albums_store_error', 'Erreur lors de la creation d un album.', $exception, $request->user(), Album::class);
            throw $exception;
        }
    }

    public function update(UpdateAlbumRequest $request, string $encryptedId): JsonResponse
    {
        $id = null;

        try {
            $id = $this->resolveEncryptedAlbumId($encryptedId);
            $validated = $request->validated();

            $album = DB::transaction(function () use ($request, $validated, $id) {
                $album = Album::query()->with(['images'])->findOrFail($id);
                $album->update([
                    'title' => $validated['title'],
                    'slug' => $this->normalizeSlug($validated['title'], $validated['slug'] ?? null),
                    'description' => $validated['description'] ?? null,
                    'status' => $validated['status'] ?? 'active',
                ]);

                $this->syncAlbumImages($album, $request, $validated);

                return $album->fresh(['images']);
            });

            return response()->json([
                'message' => 'Album mis a jour avec succes.',
                'album' => $album,
            ]);
        } catch (Throwable $exception) {
            $this->activityLogService->logError($request, 'albums_update_error', 'Erreur lors de la mise a jour d un album.', $exception, $request->user(), Album::class, $id);
            throw $exception;
        }
    }

    public function destroy(Request $request, string $encryptedId): JsonResponse
    {
        $id = null;

        try {
            $id = $this->resolveEncryptedAlbumId($encryptedId);

            DB::transaction(function () use ($id) {
                $album = Album::query()->with(['images'])->findOrFail($id);

                foreach ($album->images as $image) {
                    $this->deleteImageFile($image->image_url);
                }

                $album->delete();
            });

            return response()->json([
                'message' => 'Album supprime avec succes.',
            ]);
        } catch (Throwable $exception) {
            $this->activityLogService->logError($request, 'albums_delete_error', 'Erreur lors de la suppression d un album.', $exception, $request->user(), Album::class, $id);
            throw $exception;
        }
    }
}
