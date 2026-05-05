<?php

namespace App\Http\Controllers;

use App\Http\Requests\Materials\StoreMaterialRequest;
use App\Http\Requests\Materials\UpdateMaterialRequest;
use App\Models\Material;
use App\Services\ActivityLogService;
use App\Services\MaterialService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class MaterialController extends Controller
{
    public function __construct(
        private MaterialService $materialService,
        private ActivityLogService $activityLogService
    ) {}

    private function resolveEncryptedMaterialId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant material invalide.'],
            ]);
        }

        return $id;
    }

    private function uploadImage($file): string
    {
        $directory = public_path('uploads/materials');

        if (!File::exists($directory)) {
            File::makeDirectory($directory, 0755, true);
        }

        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $file->move($directory, $filename);

        return 'uploads/materials/' . $filename;
    }

    private function deleteImageFile(?string $imageUrl): void
    {
        if (!$imageUrl || !str_starts_with($imageUrl, 'uploads/materials/')) {
            return;
        }

        $path = public_path($imageUrl);

        if (File::exists($path)) {
            File::delete($path);
        }
    }

    private function syncMaterialImages(Material $material, Request $request, array $validated): void
    {
        $deletedIds = collect($validated['deleted_image_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->all();

        if (!empty($deletedIds)) {
            $imagesToDelete = $material->images()->whereIn('id', $deletedIds)->get();

            foreach ($imagesToDelete as $image) {
                $this->deleteImageFile($image->image_url);
                $image->delete();
            }
        }

        $currentMaxPosition = (int) ($material->images()->max('position') ?? -1);

        foreach ($request->file('images', []) as $index => $file) {
            $material->images()->create([
                'image_url' => $this->uploadImage($file),
                'name' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                'position' => $currentMaxPosition + $index + 1,
            ]);
        }
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $keys = [];
            $values = [];

            if ($request->filled('status')) {
                $keys[] = 'status';
                $values[] = $request->string('status')->toString();
            }

            if ($request->filled('category')) {
                $keys[] = 'category';
                $values[] = $request->string('category')->toString();
            }

            $materials = $this->materialService->getAllMaterials(
                keys: !empty($keys) ? $keys : null,
                values: !empty($values) ? $values : null,
                relations: ['creator', 'images'],
                paginate: $request->integer('per_page')
            );

            return response()->json($materials);
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'materials_index_error',
                'Erreur lors de la consultation des materials.',
                $exception,
                $request->user(),
                Material::class,
                null,
                500
            );

            throw $exception;
        }
    }

    public function show(Request $request, string $encryptedId): JsonResponse
    {
        $id = null;

        try {
            $id = $this->resolveEncryptedMaterialId($encryptedId);
            $material = $this->materialService->getByIdMaterial($id, ['*'], ['creator', 'images']);

            return response()->json([
                'material' => $material,
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'materials_show_validation_failed',
                'Echec de validation lors de la consultation d un material.',
                $request->user(),
                Material::class,
                null,
                422,
                [
                    'encrypted_id' => $encryptedId,
                    'errors' => $exception->errors(),
                ]
            );

            throw $exception;
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'materials_show_error',
                'Erreur lors de la consultation d un material.',
                $exception,
                $request->user(),
                Material::class,
                $id,
                500,
                ['encrypted_id' => $encryptedId]
            );

            throw $exception;
        }
    }

    public function store(StoreMaterialRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            $validated['created_by'] = $request->user()?->id;

            $material = DB::transaction(function () use ($request, $validated) {
                $material = $this->materialService->createMaterial($validated);
                $this->syncMaterialImages($material, $request, $validated);

                return $material->fresh(['creator', 'images']);
            });

            $this->activityLogService->logSuccess(
                $request,
                'materials_store',
                'Creation material reussie.',
                $request->user(),
                Material::class,
                $material->id,
                201,
                [
                    'target_name' => $material->name,
                    'target_reference' => $material->reference,
                    'images_count' => $material->images->count(),
                ]
            );

            return response()->json([
                'message' => 'Material cree avec succes.',
                'material' => $material,
            ], 201);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'materials_store_validation_failed',
                'Echec de validation lors de la creation material.',
                $request->user(),
                Material::class,
                null,
                422,
                [
                    'name' => $request->input('name'),
                    'reference' => $request->input('reference'),
                    'errors' => $exception->errors(),
                ]
            );

            throw $exception;
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'materials_store_error',
                'Erreur lors de la creation material.',
                $exception,
                $request->user(),
                Material::class,
                null,
                500,
                [
                    'name' => $request->input('name'),
                    'reference' => $request->input('reference'),
                ]
            );

            throw $exception;
        }
    }

    public function update(UpdateMaterialRequest $request, string $encryptedId): JsonResponse
    {
        $id = null;

        try {
            $id = $this->resolveEncryptedMaterialId($encryptedId);
            $material = $this->materialService->getByIdMaterial($id, ['*'], ['images']);
            $validated = $request->validated();

            $material = DB::transaction(function () use ($material, $request, $validated) {
                $material = $this->materialService->updateMaterial($material, $validated);
                $this->syncMaterialImages($material, $request, $validated);

                return $material->fresh(['creator', 'images']);
            });

            $this->activityLogService->logSuccess(
                $request,
                'materials_update',
                'Mise a jour material reussie.',
                $request->user(),
                Material::class,
                $material->id,
                200,
                [
                    'target_name' => $material->name,
                    'target_reference' => $material->reference,
                    'updated_fields' => array_keys($validated),
                    'images_count' => $material->images->count(),
                ]
            );

            return response()->json([
                'message' => 'Material mis a jour avec succes.',
                'material' => $material,
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'materials_update_validation_failed',
                'Echec de validation lors de la mise a jour material.',
                $request->user(),
                Material::class,
                $id,
                422,
                [
                    'encrypted_id' => $encryptedId,
                    'errors' => $exception->errors(),
                ]
            );

            throw $exception;
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'materials_update_error',
                'Erreur lors de la mise a jour material.',
                $exception,
                $request->user(),
                Material::class,
                $id,
                500,
                ['encrypted_id' => $encryptedId]
            );

            throw $exception;
        }
    }

    public function destroy(Request $request, string $encryptedId): JsonResponse
    {
        $id = null;

        try {
            $id = $this->resolveEncryptedMaterialId($encryptedId);
            $material = $this->materialService->getByIdMaterial($id, ['*'], ['images']);

            $targetName = $material->name;
            $targetReference = $material->reference;

            DB::transaction(function () use ($material) {
                foreach ($material->images as $image) {
                    $this->deleteImageFile($image->image_url);
                }

                $this->materialService->deleteMaterial($material);
            });

            $this->activityLogService->logInfo(
                $request,
                'materials_delete',
                'Suppression material reussie.',
                $request->user(),
                Material::class,
                $id,
                200,
                [
                    'target_name' => $targetName,
                    'target_reference' => $targetReference,
                ]
            );

            return response()->json([
                'message' => 'Material supprime avec succes.',
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'materials_delete_validation_failed',
                'Echec de validation lors de la suppression material.',
                $request->user(),
                Material::class,
                null,
                422,
                [
                    'encrypted_id' => $encryptedId,
                    'errors' => $exception->errors(),
                ]
            );

            throw $exception;
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'materials_delete_error',
                'Erreur lors de la suppression material.',
                $exception,
                $request->user(),
                Material::class,
                $id,
                500,
                ['encrypted_id' => $encryptedId]
            );

            throw $exception;
        }
    }
}

