<?php

namespace App\Repositories;

use App\Interfaces\CashTransactionInterface;
use App\Models\CashTransaction;

class CashTransactionRepository extends BaseRepository implements CashTransactionInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = [], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc'])
    {
        $fields = $this->withRequiredColumns($fields);
        $q = CashTransaction::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);
        $q = $this->applyOrderBy($q, $orderBy);

        return $paginate ? $q->paginate($paginate, $fields) : $q->get($fields);
    }

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?CashTransaction
    {
        $fields = $this->withRequiredColumns($fields);
        $q = CashTransaction::query();
        $q = $this->applyRelation($q, $relations);

        return $q->findOrFail($id, $fields);
    }

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?CashTransaction
    {
        $fields = $this->withRequiredColumns($fields);
        $q = CashTransaction::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);

        return $q->first($fields);
    }

    public function create(array $data): ?CashTransaction
    {
        return CashTransaction::create($data);
    }

    public function update(CashTransaction $cashTransaction, array $data): ?CashTransaction
    {
        $cashTransaction->update($data);
        return $cashTransaction;
    }

    public function delete(CashTransaction $cashTransaction): void
    {
        $cashTransaction->delete();
    }
}