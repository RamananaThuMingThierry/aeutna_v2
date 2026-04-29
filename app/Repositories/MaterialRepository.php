<?php

namespace App\Repositories;

use App\Interfaces\MaterialInterface;
use App\Models\Material;

class MaterialRepository extends BaseRepository implements MaterialInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = [], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc'])
    {
        $fields = $this->withRequiredColumns($fields);

        $q = Material::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);
        $q = $this->applyOrderBy($q, $orderBy);

        return $paginate ? $q->paginate($paginate, $fields) : $q->get($fields);
    }

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?Material
    {
        $fields = $this->withRequiredColumns($fields);

        $q = Material::query();
        $q = $this->applyRelation($q, $relations);

        return $q->findOrFail($id, $fields);
    }

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?Material
    {
        $fields = $this->withRequiredColumns($fields);

        $q = Material::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);

        return $q->first($fields);
    }

    public function create(array $data): ?Material
    {
        return Material::create($data);
    }

    public function update(Material $material, array $data): ?Material
    {
        $material->update($data);

        return $material;
    }

    public function delete(Material $material): void
    {
        $material->delete();
    }
}
