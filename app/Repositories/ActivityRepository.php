<?php

namespace App\Repositories;

use App\Interfaces\ActivityInterface;
use App\Models\Activity;

class ActivityRepository extends BaseRepository implements ActivityInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = [], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc'])
    {
        $fields = $this->withRequiredColumns($fields);

        $q = Activity::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);
        $q = $this->applyOrderBy($q, $orderBy);

        return $paginate ? $q->paginate($paginate, $fields) : $q->get($fields);
    }

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?Activity
    {
        $fields = $this->withRequiredColumns($fields);

        $q = Activity::query();
        $q = $this->applyRelation($q, $relations);

        return $q->findOrFail($id, $fields);
    }

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?Activity
    {
        $fields = $this->withRequiredColumns($fields);

        $q = Activity::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);

        return $q->first($fields);
    }

    public function create(array $data): ?Activity
    {
        return Activity::create($data);
    }

    public function update(Activity $activity, array $data): ?Activity
    {
        $activity->update($data);

        return $activity;
    }

    public function delete(Activity $activity): void
    {
        $activity->delete();
    }
}
