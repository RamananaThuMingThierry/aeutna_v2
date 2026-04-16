<?php

namespace App\Services;

use App\Interfaces\ActivityLogInterface;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Throwable;

class ActivityLogService
{
    public function __construct(private ActivityLogInterface $activityLogRepository) {}

    public function getAllActivityLogs(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc'])
    {
        return $this->activityLogRepository->getAll($keys, $values, $fields, $relations, $paginate, $orderBy);
    }

    public function getByIdActivityLog(int|string $id, array $fields = ['*'], array $relations = [])
    {
        return $this->activityLogRepository->getById($id, $fields, $relations);
    }

    public function getByKeysActivityLog(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [])
    {
        return $this->activityLogRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function createActivityLog(array $data)
    {
        return $this->activityLogRepository->create($data);
    }

    public function logRequestActivity(
        Request $request,
        string $action,
        string $color,
        string $message,
        ?User $user = null,
        ?string $entityType = null,
        ?int $entityId = null,
        ?int $statusCode = null,
        array $metadata = []
    ): void {
        try {
            $this->createActivityLog([
                'user_id' => $user?->id,
                'action' => $action,
                'color' => $color,
                'entity_type' => $entityType ?? User::class,
                'entity_id' => $entityId ?? $user?->id,
                'method' => $request->method(),
                'route' => $request->path(),
                'status_code' => $statusCode,
                'message' => $message,
                'metadata' => array_filter([
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    ...$metadata,
                ], fn ($value) => $value !== null),
            ]);
        } catch (Throwable) {
            // Le logging ne doit jamais casser le flux principal.
        }
    }

    public function logSuccess(
        Request $request,
        string $action,
        string $message,
        ?User $user = null,
        ?string $entityType = null,
        ?int $entityId = null,
        ?int $statusCode = null,
        array $metadata = []
    ): void {
        $this->logRequestActivity($request, $action, 'success', $message, $user, $entityType, $entityId, $statusCode, $metadata);
    }

    public function logWarning(
        Request $request,
        string $action,
        string $message,
        ?User $user = null,
        ?string $entityType = null,
        ?int $entityId = null,
        ?int $statusCode = null,
        array $metadata = []
    ): void {
        $this->logRequestActivity($request, $action, 'warning', $message, $user, $entityType, $entityId, $statusCode, $metadata);
    }

    public function logInfo(
        Request $request,
        string $action,
        string $message,
        ?User $user = null,
        ?string $entityType = null,
        ?int $entityId = null,
        ?int $statusCode = null,
        array $metadata = []
    ): void {
        $this->logRequestActivity($request, $action, 'info', $message, $user, $entityType, $entityId, $statusCode, $metadata);
    }

    public function logError(
        Request $request,
        string $action,
        string $message,
        Throwable $exception,
        ?User $user = null,
        ?string $entityType = null,
        ?int $entityId = null,
        ?int $statusCode = null,
        array $metadata = []
    ): void {
        $this->logRequestActivity(
            $request,
            $action,
            'danger',
            $message,
            $user,
            $entityType,
            $entityId,
            $statusCode ?? 500,
            [
                ...$metadata,
                'exception' => get_class($exception),
                'error' => $exception->getMessage(),
            ]
        );
    }

    public function deleteActivityLog(ActivityLog $activityLog)
    {
        $this->activityLogRepository->delete($activityLog);
    }
}
