<?php

namespace App\Repositories;

use App\Interfaces\ActivityImageInterface;
use App\Models\ActivityImage;

class ActivityImageRepository extends BaseRepository implements ActivityImageInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = [], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc'])
    {
        $fields = $this->withRequiredColumns($fields);

        $q = ActivityImage::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);
        $q = $this->applyOrderBy($q, $orderBy);

        return $paginate ? $q->paginate($paginate, $fields) : $q->get($fields);
    }

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?ActivityImage
    {
        $fields = $this->withRequiredColumns($fields);

        $q = ActivityImage::query();
        $q = $this->applyRelation($q, $relations);

        return $q->findOrFail($id, $fields);
    }

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?ActivityImage
    {
        $fields = $this->withRequiredColumns($fields);

        $q = ActivityImage::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);

        return $q->first($fields);
    }

    public function create(array $data): ?ActivityImage
    {
        return ActivityImage::create($data);
    }

    public function update(ActivityImage $activityImage, array $data): ?ActivityImage
    {
        $activityImage->update($data);

        return $activityImage;
    }

    public function delete(ActivityImage $activityImage): void
    {
        $activityImage->delete();
    }

    public function deleteByIds(array $ids): void
    {
        if (empty($ids)) {
            return;
        }

        ActivityImage::query()->whereIn('id', $ids)->delete();
    }

    public function clearCoverForActivity(int $activityId, ?int $exceptId = null): void
    {
        $query = ActivityImage::query()->where('activity_id', $activityId);

        if ($exceptId !== null) {
            $query->where('id', '!=', $exceptId);
        }

        $query->update(['is_cover' => false]);
    }
}
