<?php

namespace App\Interfaces;

use App\Models\ActivityImage;

interface ActivityImageInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc']);

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?ActivityImage;

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?ActivityImage;

    public function create(array $data): ?ActivityImage;

    public function update(ActivityImage $activityImage, array $data): ?ActivityImage;

    public function delete(ActivityImage $activityImage): void;

    public function deleteByIds(array $ids): void;

    public function clearCoverForActivity(int $activityId, ?int $exceptId = null): void;
}
