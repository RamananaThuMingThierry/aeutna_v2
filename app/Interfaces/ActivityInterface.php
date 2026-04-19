<?php

namespace App\Interfaces;

use App\Models\Activity;

interface ActivityInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc']);

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?Activity;

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?Activity;

    public function create(array $data): ?Activity;

    public function update(Activity $activity, array $data): ?Activity;

    public function delete(Activity $activity): void;
}
