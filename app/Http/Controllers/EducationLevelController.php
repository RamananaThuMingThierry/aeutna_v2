<?php

namespace App\Http\Controllers;

use App\Http\Requests\EducationLevels\StoreEducationLevelRequest;
use App\Http\Requests\EducationLevels\UpdateEducationLevelRequest;
use App\Models\EducationLevel;
use App\Services\ActivityLogService;
use App\Services\EducationLevelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class EducationLevelController extends Controller
{
    public function __construct(
        private EducationLevelService $educationLevelService,
        private ActivityLogService $activityLogService
    ) {}

    private function resolveEncryptedEducationLevelId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant niveau d education invalide.'],
            ]);
        }

        return $id;
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $educationLevels = $this->educationLevelService->getAllEducationLevels(
                fields: ['*'],
                paginate: $request->integer('per_page')
            );

            return response()->json($educationLevels);
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'education_levels_index_error',
                'Erreur lors de la consultation de la liste des niveaux d education.',
                $exception,
                $request->user(),
                EducationLevel::class,
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
            $id = $this->resolveEncryptedEducationLevelId($encryptedId);
            $educationLevel = $this->educationLevelService->getByIdEducationLevel($id);

            return response()->json([
                'education_level' => $educationLevel,
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'education_levels_show_validation_failed',
                'Echec de validation lors de la consultation d un niveau d education.',
                $request->user(),
                EducationLevel::class,
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
                'education_levels_show_error',
                'Erreur lors de la consultation d un niveau d education.',
                $exception,
                $request->user(),
                EducationLevel::class,
                $id,
                500,
                [
                    'encrypted_id' => $encryptedId,
                ]
            );

            throw $exception;
        }
    }

    public function store(StoreEducationLevelRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();

            $educationLevel = $this->educationLevelService->createEducationLevel([
                'name' => $validated['name'],
                'code' => $validated['code'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            $this->activityLogService->logSuccess(
                $request,
                'education_levels_store',
                'Creation niveau d education reussie.',
                $request->user(),
                EducationLevel::class,
                $educationLevel->id,
                201,
                [
                    'target_name' => $educationLevel->name,
                    'target_code' => $educationLevel->code,
                ]
            );

            return response()->json([
                'message' => 'Niveau d education cree avec succes.',
                'education_level' => $educationLevel,
            ], 201);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'education_levels_store_validation_failed',
                'Echec de validation lors de la creation niveau d education.',
                $request->user(),
                EducationLevel::class,
                null,
                422,
                [
                    'name' => $request->input('name'),
                    'code' => $request->input('code'),
                    'errors' => $exception->errors(),
                ]
            );

            throw $exception;
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'education_levels_store_error',
                'Erreur lors de la creation niveau d education.',
                $exception,
                $request->user(),
                EducationLevel::class,
                null,
                500,
                [
                    'name' => $request->input('name'),
                    'code' => $request->input('code'),
                ]
            );

            throw $exception;
        }
    }

    public function update(UpdateEducationLevelRequest $request, string $encryptedId): JsonResponse
    {
        $id = null;

        try {
            $id = $this->resolveEncryptedEducationLevelId($encryptedId);
            $educationLevel = $this->educationLevelService->getByIdEducationLevel($id);
            $validated = $request->validated();

            $educationLevel = $this->educationLevelService->updateEducationLevel($educationLevel, $validated);

            $this->activityLogService->logSuccess(
                $request,
                'education_levels_update',
                'Mise a jour niveau d education reussie.',
                $request->user(),
                EducationLevel::class,
                $educationLevel->id,
                200,
                [
                    'target_name' => $educationLevel->name,
                    'target_code' => $educationLevel->code,
                    'updated_fields' => array_keys($validated),
                ]
            );

            return response()->json([
                'message' => 'Niveau d education mis a jour avec succes.',
                'education_level' => $educationLevel,
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'education_levels_update_validation_failed',
                'Echec de validation lors de la mise a jour niveau d education.',
                $request->user(),
                EducationLevel::class,
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
                'education_levels_update_error',
                'Erreur lors de la mise a jour niveau d education.',
                $exception,
                $request->user(),
                EducationLevel::class,
                $id,
                500,
                [
                    'encrypted_id' => $encryptedId,
                ]
            );

            throw $exception;
        }
    }

    public function destroy(Request $request, string $encryptedId): JsonResponse
    {
        $id = null;

        try {
            $id = $this->resolveEncryptedEducationLevelId($encryptedId);
            $educationLevel = $this->educationLevelService->getByIdEducationLevel($id);

            $targetName = $educationLevel->name;
            $targetCode = $educationLevel->code;

            $this->educationLevelService->deleteEducationLevel($educationLevel);

            $this->activityLogService->logInfo(
                $request,
                'education_levels_delete',
                'Suppression niveau d education reussie.',
                $request->user(),
                EducationLevel::class,
                $id,
                200,
                [
                    'target_name' => $targetName,
                    'target_code' => $targetCode,
                ]
            );

            return response()->json([
                'message' => 'Niveau d education supprime avec succes.',
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'education_levels_delete_validation_failed',
                'Echec de validation lors de la suppression niveau d education.',
                $request->user(),
                EducationLevel::class,
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
                'education_levels_delete_error',
                'Erreur lors de la suppression niveau d education.',
                $exception,
                $request->user(),
                EducationLevel::class,
                $id,
                500,
                [
                    'encrypted_id' => $encryptedId,
                ]
            );

            throw $exception;
        }
    }
}
