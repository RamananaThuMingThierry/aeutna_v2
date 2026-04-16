<?php

namespace App\Repositories;

use App\Repositories\BaseRepository;
use App\Interfaces\ActivityLogInterface;
use App\Models\ActivityLog;

class ActivityLogRepository extends BaseRepository implements ActivityLogInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc'])
    {
        $fields = $this->withRequiredColumns($fields);

        $query = ActivityLog::query();

        $query = $this->applyFilter($query, $keys, $values);
        $query = $this->applyRelation($query, $relations);
        $query = $this->applyOrderBy($query, $orderBy);

        return $paginate ? $query->paginate($paginate, $fields) : $query->get($fields);
    }

    public function getById(int|string|null $id, array $fields = ['*'], array $relations = []): ?ActivityLog
    {
        $fields = $this->withRequiredColumns($fields);

        $query = ActivityLog::query();
        $query = $this->applyRelation($query, $relations);

        return $query->findOrFail($id, $fields);
    }

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = ['*'], array $relations = []): ?ActivityLog
    {
        $fields = $this->withRequiredColumns($fields);

        $query = ActivityLog::query();
        $query = $this->applyRelation($query, $relations);
        $query = $this->applyFilter($query, $keys, $values);

        return $query->first($fields);
    }

    public function create(array $data): ?ActivityLog
    {
        return ActivityLog::create($data);
    }

    public function delete(ActivityLog $log): void
    {
        $log->delete();
    }
}
