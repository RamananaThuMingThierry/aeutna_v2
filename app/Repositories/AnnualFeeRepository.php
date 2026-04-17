<?php

namespace App\Repositories;

use App\Interfaces\AnnualFeeInterface;
use App\Models\AnnualFee;

class AnnualFeeRepository extends BaseRepository implements AnnualFeeInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = [], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc'])
    {
        $fields = $this->withRequiredColumns($fields);

        $q = AnnualFee::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);
        $q = $this->applyOrderBy($q, $orderBy);

        return $paginate ? $q->paginate($paginate, $fields) : $q->get($fields);
    }

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?AnnualFee
    {
        $fields = $this->withRequiredColumns($fields);

        $q = AnnualFee::query();
        $q = $this->applyRelation($q, $relations);

        return $q->findOrFail($id, $fields);
    }

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?AnnualFee
    {
        $fields = $this->withRequiredColumns($fields);

        $q = AnnualFee::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);

        return $q->first($fields);
    }

    public function create(array $data): ?AnnualFee
    {
        return AnnualFee::create($data);
    }

    public function update(AnnualFee $annualFee, array $data): ?AnnualFee
    {
        $annualFee->update($data);
        return $annualFee;
    }

    public function delete(AnnualFee $annualFee): void
    {
        $annualFee->delete();
    }
}
