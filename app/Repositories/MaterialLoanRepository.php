<?php

namespace App\Repositories;

use App\Interfaces\MaterialLoanInterface;
use App\Models\MaterialLoan;

class MaterialLoanRepository extends BaseRepository implements MaterialLoanInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = [], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc'])
    {
        $fields = $this->withRequiredColumns($fields);

        $q = MaterialLoan::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);
        $q = $this->applyOrderBy($q, $orderBy);

        return $paginate ? $q->paginate($paginate, $fields) : $q->get($fields);
    }

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?MaterialLoan
    {
        $fields = $this->withRequiredColumns($fields);

        $q = MaterialLoan::query();
        $q = $this->applyRelation($q, $relations);

        return $q->findOrFail($id, $fields);
    }

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?MaterialLoan
    {
        $fields = $this->withRequiredColumns($fields);

        $q = MaterialLoan::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);

        return $q->first($fields);
    }

    public function create(array $data): ?MaterialLoan
    {
        return MaterialLoan::create($data);
    }

    public function update(MaterialLoan $materialLoan, array $data): ?MaterialLoan
    {
        $materialLoan->update($data);

        return $materialLoan;
    }

    public function delete(MaterialLoan $materialLoan): void
    {
        $materialLoan->delete();
    }
}
