<?php

namespace App\Http\Controllers;

use App\Http\Requests\Functions\StoreFunctionRequest;
use App\Http\Requests\Functions\UpdateFunctionRequest;
use App\Models\Functions;
use App\Services\ActivityLogService;
use App\Services\FunctionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class FunctionController extends Controller
{
    public function __construct(
        private FunctionService $functionService,
        private ActivityLogService $activityLogService
    ) {}

    private function resolveEncryptedFunctionId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant fonction invalide.'],
            ]);
        }

        return $id;
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $functions = $this->functionService->getAllFunctions(
                fields: ['*'],
                paginate: $request->integer('per_page')
            );

            $this->activityLogService->logInfo(
                $request,
                'functions_index',
                'Consultation de la liste des fonctions.',
                $request->user(),
                Functions::class,
                null,
                200,
                [
                    'per_page' => $request->integer('per_page'),
                ]
            );

            return response()->json($functions);
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'functions_index_error',
                'Erreur lors de la consultation de la liste des fonctions.',
                $exception,
                $request->user(),
                Functions::class,
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
            $id = $this->resolveEncryptedFunctionId($encryptedId);
            $function = $this->functionService->getByIdFunction($id);

            $this->activityLogService->logInfo(
                $request,
                'functions_show',
                'Consultation d une fonction.',
                $request->user(),
                Functions::class,
                $function->id,
                200,
                [
                    'target_name' => $function->name,
                    'target_code' => $function->code,
                ]
            );

            return response()->json([
                'function' => $function,
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'functions_show_validation_failed',
                'Echec de validation lors de la consultation d une fonction.',
                $request->user(),
                Functions::class,
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
                'functions_show_error',
                'Erreur lors de la consultation d une fonction.',
                $exception,
                $request->user(),
                Functions::class,
                $id,
                500,
                [
                    'encrypted_id' => $encryptedId,
                ]
            );

            throw $exception;
        }
    }

    public function store(StoreFunctionRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();

            $function = $this->functionService->createFunction([
                'name' => $validated['name'],
                'code' => $validated['code'] ?? null,
                'description' => $validated['description'] ?? null,
                'is_executive' => $validated['is_executive'] ?? false,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            $this->activityLogService->logSuccess(
                $request,
                'functions_store',
                'Creation fonction reussie.',
                $request->user(),
                Functions::class,
                $function->id,
                201,
                [
                    'target_name' => $function->name,
                    'target_code' => $function->code,
                    'is_executive' => $function->is_executive,
                ]
            );

            return response()->json([
                'message' => 'Fonction creee avec succes.',
                'function' => $function,
            ], 201);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'functions_store_validation_failed',
                'Echec de validation lors de la creation fonction.',
                $request->user(),
                Functions::class,
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
                'functions_store_error',
                'Erreur lors de la creation fonction.',
                $exception,
                $request->user(),
                Functions::class,
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

    public function update(UpdateFunctionRequest $request, string $encryptedId): JsonResponse
    {
        $id = null;

        try {
            $id = $this->resolveEncryptedFunctionId($encryptedId);
            $function = $this->functionService->getByIdFunction($id);
            $validated = $request->validated();

            $function = $this->functionService->updateFunction($function, $validated);

            $this->activityLogService->logSuccess(
                $request,
                'functions_update',
                'Mise a jour fonction reussie.',
                $request->user(),
                Functions::class,
                $function->id,
                200,
                [
                    'target_name' => $function->name,
                    'target_code' => $function->code,
                    'updated_fields' => array_keys($validated),
                ]
            );

            return response()->json([
                'message' => 'Fonction mise a jour avec succes.',
                'function' => $function,
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'functions_update_validation_failed',
                'Echec de validation lors de la mise a jour fonction.',
                $request->user(),
                Functions::class,
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
                'functions_update_error',
                'Erreur lors de la mise a jour fonction.',
                $exception,
                $request->user(),
                Functions::class,
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
            $id = $this->resolveEncryptedFunctionId($encryptedId);
            $function = $this->functionService->getByIdFunction($id);

            $targetName = $function->name;
            $targetCode = $function->code;

            $this->functionService->deleteFunction($function);

            $this->activityLogService->logInfo(
                $request,
                'functions_delete',
                'Suppression fonction reussie.',
                $request->user(),
                Functions::class,
                $id,
                200,
                [
                    'target_name' => $targetName,
                    'target_code' => $targetCode,
                ]
            );

            return response()->json([
                'message' => 'Fonction supprimee avec succes.',
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'functions_delete_validation_failed',
                'Echec de validation lors de la suppression fonction.',
                $request->user(),
                Functions::class,
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
                'functions_delete_error',
                'Erreur lors de la suppression fonction.',
                $exception,
                $request->user(),
                Functions::class,
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
