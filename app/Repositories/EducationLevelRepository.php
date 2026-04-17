<?php

namespace App\Repositories;

use App\Interfaces\EducationLevelInterface;
use App\Models\EducationLevel;

class EducationLevelRepository extends BaseRepository implements EducationLevelInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = [], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc'])
    {
        $fields = $this->withRequiredColumns($fields);

        $q = EducationLevel::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);
        $q = $this->applyOrderBy($q, $orderBy);

        return $paginate ? $q->paginate($paginate, $fields) : $q->get($fields);
    }

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?EducationLevel
    {
        $fields = $this->withRequiredColumns($fields);

        $q = EducationLevel::query();
        $q = $this->applyRelation($q, $relations);

        return $q->findOrFail($id, $fields);
    }

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?EducationLevel
    {
        $fields = $this->withRequiredColumns($fields);

        $q = EducationLevel::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);

        return $q->first($fields);
    }

    public function create(array $data): ?EducationLevel
    {
        return EducationLevel::create($data);
    }

    public function update(EducationLevel $educationLevel, array $data): ?EducationLevel
    {
        $educationLevel->update($data);
        return $educationLevel;
    }

    public function delete(EducationLevel $educationLevel): void
    {
        $educationLevel->delete();
    }
}
