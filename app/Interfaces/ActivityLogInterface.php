<?php

namespace App\Interfaces;

use App\Models\ActivityLog;

interface ActivityLogInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc']);

    public function getById(int|string|null $id, array $fields = ['*'], array $relations = []): ?ActivityLog;

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = ['*'], array $relations = []): ?ActivityLog;

    public function create(array $data): ?ActivityLog;

    public function delete(ActivityLog $log): void;
}
