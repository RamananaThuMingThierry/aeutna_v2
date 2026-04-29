<?php

namespace App\Http\Controllers;

use App\Http\Requests\Materials\StoreMaterialRequest;
use App\Http\Requests\Materials\UpdateMaterialRequest;
use App\Models\Material;
use App\Services\ActivityLogService;
use App\Services\MaterialService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
                relations: ['creator'],
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
            $material = $this->materialService->getByIdMaterial($id, ['*'], ['creator']);

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

            $material = $this->materialService->createMaterial($validated);

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
                ]
            );

            return response()->json([
                'message' => 'Material cree avec succes.',
                'material' => $material->fresh(['creator']),
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
            $material = $this->materialService->getByIdMaterial($id);
            $validated = $request->validated();

            $material = $this->materialService->updateMaterial($material, $validated);

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
                ]
            );

            return response()->json([
                'message' => 'Material mis a jour avec succes.',
                'material' => $material->fresh(['creator']),
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
            $material = $this->materialService->getByIdMaterial($id);

            $targetName = $material->name;
            $targetReference = $material->reference;

            $this->materialService->deleteMaterial($material);

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
