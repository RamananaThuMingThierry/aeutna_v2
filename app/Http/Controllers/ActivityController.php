<?php

namespace App\Http\Controllers;

use App\Http\Requests\Activities\StoreActivityRequest;
use App\Http\Requests\Activities\UpdateActivityRequest;
use App\Models\Activity;
use App\Services\ActivityLogService;
use App\Services\ActivityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class ActivityController extends Controller
{
    public function __construct(
        private ActivityService $activityService,
        private ActivityLogService $activityLogService
    ) {}

    private function resolveEncryptedActivityId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant activite invalide.'],
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

            $activities = $this->activityService->getAllActivities(
                keys: !empty($keys) ? $keys : null,
                values: !empty($values) ? $values : null,
                relations: ['creator', 'images'],
                paginate: $request->integer('per_page')
            );

            return response()->json($activities);
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'activities_index_error',
                'Erreur lors de la consultation des activites.',
                $exception,
                $request->user(),
                Activity::class,
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
            $id = $this->resolveEncryptedActivityId($encryptedId);
            $activity = $this->activityService->getByIdActivity($id, ['*'], ['creator', 'images']);

            return response()->json([
                'activity' => $activity,
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'activities_show_validation_failed',
                'Echec de validation lors de la consultation d une activite.',
                $request->user(),
                Activity::class,
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
                'activities_show_error',
                'Erreur lors de la consultation d une activite.',
                $exception,
                $request->user(),
                Activity::class,
                $id,
                500,
                ['encrypted_id' => $encryptedId]
            );

            throw $exception;
        }
    }

    public function store(StoreActivityRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            $validated['created_by'] = $request->user()?->id;

            $activity = $this->activityService->createActivity($validated, $request->file('images', []));

            $this->activityLogService->logSuccess(
                $request,
                'activities_store',
                'Creation activite reussie.',
                $request->user(),
                Activity::class,
                $activity->id,
                201,
                [
                    'target_title' => $activity->title,
                    'images_count' => $activity->images->count(),
                ]
            );

            return response()->json([
                'message' => 'Activite creee avec succes.',
                'activity' => $activity,
            ], 201);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'activities_store_validation_failed',
                'Echec de validation lors de la creation activite.',
                $request->user(),
                Activity::class,
                null,
                422,
                [
                    'title' => $request->input('title'),
                    'errors' => $exception->errors(),
                ]
            );

            throw $exception;
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'activities_store_error',
                'Erreur lors de la creation activite.',
                $exception,
                $request->user(),
                Activity::class,
                null,
                500,
                ['title' => $request->input('title')]
            );

            throw $exception;
        }
    }

    public function update(UpdateActivityRequest $request, string $encryptedId): JsonResponse
    {
        $id = null;

        try {
            $id = $this->resolveEncryptedActivityId($encryptedId);
            $activity = $this->activityService->getByIdActivity($id, ['*'], ['images']);
            $validated = $request->validated();

            $activity = $this->activityService->updateActivity($activity, $validated, $request->file('images', []));

            $this->activityLogService->logSuccess(
                $request,
                'activities_update',
                'Mise a jour activite reussie.',
                $request->user(),
                Activity::class,
                $activity->id,
                200,
                [
                    'target_title' => $activity->title,
                    'updated_fields' => array_keys($validated),
                    'images_count' => $activity->images->count(),
                ]
            );

            return response()->json([
                'message' => 'Activite mise a jour avec succes.',
                'activity' => $activity,
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'activities_update_validation_failed',
                'Echec de validation lors de la mise a jour activite.',
                $request->user(),
                Activity::class,
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
                'activities_update_error',
                'Erreur lors de la mise a jour activite.',
                $exception,
                $request->user(),
                Activity::class,
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
            $id = $this->resolveEncryptedActivityId($encryptedId);
            $activity = $this->activityService->getByIdActivity($id, ['*'], ['images']);
            $title = $activity->title;

            $this->activityService->deleteActivity($activity);

            $this->activityLogService->logInfo(
                $request,
                'activities_delete',
                'Suppression activite reussie.',
                $request->user(),
                Activity::class,
                $id,
                200,
                ['target_title' => $title]
            );

            return response()->json([
                'message' => 'Activite supprimee avec succes.',
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'activities_delete_validation_failed',
                'Echec de validation lors de la suppression activite.',
                $request->user(),
                Activity::class,
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
                'activities_delete_error',
                'Erreur lors de la suppression activite.',
                $exception,
                $request->user(),
                Activity::class,
                $id,
                500,
                ['encrypted_id' => $encryptedId]
            );

            throw $exception;
        }
    }
}
