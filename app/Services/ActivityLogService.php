<?php

namespace App\Services;

use App\Interfaces\ActivityLogInterface;
use App\Models\ActivityLog;

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

    public function deleteActivityLog(ActivityLog $activityLog)
    {
        $this->activityLogRepository->delete($activityLog);
    }
}
