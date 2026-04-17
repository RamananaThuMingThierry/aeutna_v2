<?php

namespace App\Repositories;

use App\Interfaces\FunctionInterface;
use App\Models\Functions;

class FunctionRepository extends BaseRepository implements FunctionInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = [], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc'])
    {
        $fields = $this->withRequiredColumns($fields);

        $q = Functions::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);
        $q = $this->applyOrderBy($q, $orderBy);

        return $paginate ? $q->paginate($paginate, $fields) : $q->get($fields);
    }

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?Functions
    {
        $fields = $this->withRequiredColumns($fields);

        $q = Functions::query();
        $q = $this->applyRelation($q, $relations);

        return $q->findOrFail($id, $fields);
    }

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?Functions
    {
        $fields = $this->withRequiredColumns($fields);

        $q = Functions::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);

        return $q->first($fields);
    }

    public function create(array $data): ?Functions
    {
        return Functions::create($data);
    }

    public function update(Functions $function, array $data): ?Functions
    {
        $function->update($data);
        return $function;
    }

    public function delete(Functions $function): void
    {
        $function->delete();
    }
}
