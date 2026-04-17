<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Axes\StoreAxeRequest;
use App\Http\Requests\Axes\UpdateAxeRequest;
use App\Models\Axe;
use App\Services\ActivityLogService;
use App\Services\AxeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class AxeController extends Controller
{
    public function __construct(
        private AxeService $axeService,
        private ActivityLogService $activityLogService
    ) {}

    private function resolveEncryptedAxeId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant axe invalide.'],
            ]);
        }

        return $id;
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $axes = $this->axeService->getAllAxes(
                fields: ['*'],
                paginate: $request->integer('per_page')
            );

            $this->activityLogService->logInfo(
                $request,
                'axes_index',
                'Consultation de la liste des axes.',
                $request->user(),
                Axe::class,
                null,
                200,
                [
                    'per_page' => $request->integer('per_page'),
                ]
            );

            return response()->json($axes);
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'axes_index_error',
                'Erreur lors de la consultation de la liste des axes.',
                $exception,
                $request->user(),
                Axe::class,
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
            $id = $this->resolveEncryptedAxeId($encryptedId);
            $axe = $this->axeService->getByIdAxe($id);

            $this->activityLogService->logInfo(
                $request,
                'axes_show',
                'Consultation d un axe.',
                $request->user(),
                Axe::class,
                $axe->id,
                200,
                [
                    'target_name' => $axe->name,
                    'target_code' => $axe->code,
                ]
            );

            return response()->json([
                'axe' => $axe,
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'axes_show_validation_failed',
                'Echec de validation lors de la consultation d un axe.',
                $request->user(),
                Axe::class,
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
                'axes_show_error',
                'Erreur lors de la consultation d un axe.',
                $exception,
                $request->user(),
                Axe::class,
                $id,
                500,
                [
                    'encrypted_id' => $encryptedId,
                ]
            );

            throw $exception;
        }
    }

    public function store(StoreAxeRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();

            $axe = $this->axeService->createAxe([
                'name' => $validated['name'],
                'code' => $validated['code'] ?? null,
                'description' => $validated['description'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            $this->activityLogService->logSuccess(
                $request,
                'axes_store',
                'Creation axe reussie.',
                $request->user(),
                Axe::class,
                $axe->id,
                201,
                [
                    'target_name' => $axe->name,
                    'target_code' => $axe->code,
                ]
            );

            return response()->json([
                'message' => 'Axe cree avec succes.',
                'axe' => $axe,
            ], 201);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'axes_store_validation_failed',
                'Echec de validation lors de la creation axe.',
                $request->user(),
                Axe::class,
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
                'axes_store_error',
                'Erreur lors de la creation axe.',
                $exception,
                $request->user(),
                Axe::class,
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

    public function update(UpdateAxeRequest $request, string $encryptedId): JsonResponse
    {
        $id = null;

        try {
            $id = $this->resolveEncryptedAxeId($encryptedId);
            $axe = $this->axeService->getByIdAxe($id);
            $validated = $request->validated();

            $axe = $this->axeService->updateAxe($axe, $validated);

            $this->activityLogService->logSuccess(
                $request,
                'axes_update',
                'Mise a jour axe reussie.',
                $request->user(),
                Axe::class,
                $axe->id,
                200,
                [
                    'target_name' => $axe->name,
                    'target_code' => $axe->code,
                    'updated_fields' => array_keys($validated),
                ]
            );

            return response()->json([
                'message' => 'Axe mis a jour avec succes.',
                'axe' => $axe,
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'axes_update_validation_failed',
                'Echec de validation lors de la mise a jour axe.',
                $request->user(),
                Axe::class,
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
                'axes_update_error',
                'Erreur lors de la mise a jour axe.',
                $exception,
                $request->user(),
                Axe::class,
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
            $id = $this->resolveEncryptedAxeId($encryptedId);
            $axe = $this->axeService->getByIdAxe($id);

            $targetName = $axe->name;
            $targetCode = $axe->code;

            $this->axeService->deleteAxe($axe);

            $this->activityLogService->logInfo(
                $request,
                'axes_delete',
                'Suppression axe reussie.',
                $request->user(),
                Axe::class,
                $id,
                200,
                [
                    'target_name' => $targetName,
                    'target_code' => $targetCode,
                ]
            );

            return response()->json([
                'message' => 'Axe supprime avec succes.',
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'axes_delete_validation_failed',
                'Echec de validation lors de la suppression axe.',
                $request->user(),
                Axe::class,
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
                'axes_delete_error',
                'Erreur lors de la suppression axe.',
                $exception,
                $request->user(),
                Axe::class,
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
