<?php

namespace App\Repositories;

use App\Interfaces\FeePaymentInterface;
use App\Models\FeePayment;

class FeePaymentRepository extends BaseRepository implements FeePaymentInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = [], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc'])
    {
        $fields = $this->withRequiredColumns($fields);

        $q = FeePayment::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);
        $q = $this->applyOrderBy($q, $orderBy);

        return $paginate ? $q->paginate($paginate, $fields) : $q->get($fields);
    }

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?FeePayment
    {
        $fields = $this->withRequiredColumns($fields);

        $q = FeePayment::query();
        $q = $this->applyRelation($q, $relations);

        return $q->findOrFail($id, $fields);
    }

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?FeePayment
    {
        $fields = $this->withRequiredColumns($fields);

        $q = FeePayment::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);

        return $q->first($fields);
    }

    public function create(array $data): ?FeePayment
    {
        return FeePayment::create($data);
    }

    public function update(FeePayment $feePayment, array $data): ?FeePayment
    {
        $feePayment->update($data);
        return $feePayment;
    }

    public function delete(FeePayment $feePayment): void
    {
        $feePayment->delete();
    }
}
