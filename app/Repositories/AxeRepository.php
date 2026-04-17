<?php

namespace App\Repositories;

use App\Interfaces\AxeInterface;
use App\Models\Axe;

class AxeRepository extends BaseRepository implements AxeInterface
{
        public function getAll(string|array|null $keys, mixed $values, array $fields = [], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc']){
        $fields = $this->withRequiredColumns($fields);

        $q = Axe::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);
        $q = $this->applyOrderBy($q, $orderBy);

        return $paginate ? $q->paginate($paginate, $fields) : $q->get($fields);
    }

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?Axe
    {
        $fields = $this->withRequiredColumns($fields);

        $q = Axe::query();
        $q = $this->applyRelation($q, $relations);

        return $q->findOrFail($id, $fields);
    }

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?Axe
    {
        $fields = $this->withRequiredColumns($fields);

        $q = Axe::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);

        return $q->first($fields);
    }

    public function create(array $data): ?Axe
    {
        return Axe::create($data);
    }

    public function update(Axe $axe, array $data): ?Axe
    {
        $axe->update($data);
        return $axe;
    }

    public function delete(Axe $axe): void
    {
       $axe->delete();
    }
}
