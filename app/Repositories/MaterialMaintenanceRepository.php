<?php

namespace App\Repositories;

use App\Interfaces\MaterialMaintenanceInterface;
use App\Models\MaterialMaintenance;

class MaterialMaintenanceRepository extends BaseRepository implements MaterialMaintenanceInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = [], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc'])
    {
        $fields = $this->withRequiredColumns($fields);

        $q = MaterialMaintenance::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);
        $q = $this->applyOrderBy($q, $orderBy);

        return $paginate ? $q->paginate($paginate, $fields) : $q->get($fields);
    }

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?MaterialMaintenance
    {
        $fields = $this->withRequiredColumns($fields);

        $q = MaterialMaintenance::query();
        $q = $this->applyRelation($q, $relations);

        return $q->findOrFail($id, $fields);
    }

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?MaterialMaintenance
    {
        $fields = $this->withRequiredColumns($fields);

        $q = MaterialMaintenance::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);

        return $q->first($fields);
    }

    public function create(array $data): ?MaterialMaintenance
    {
        return MaterialMaintenance::create($data);
    }

    public function update(MaterialMaintenance $materialMaintenance, array $data): ?MaterialMaintenance
    {
        $materialMaintenance->update($data);

        return $materialMaintenance;
    }

    public function delete(MaterialMaintenance $materialMaintenance): void
    {
        $materialMaintenance->delete();
    }
}
