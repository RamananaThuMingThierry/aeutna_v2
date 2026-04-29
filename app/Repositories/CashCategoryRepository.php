<?php

namespace App\Repositories;

use App\Interfaces\CashCategoryInterface;
use App\Models\CashCategory;

class CashCategoryRepository extends BaseRepository implements CashCategoryInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = [], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc'])
    {
        $fields = $this->withRequiredColumns($fields);
        $q = CashCategory::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);
        $q = $this->applyOrderBy($q, $orderBy);

        return $paginate ? $q->paginate($paginate, $fields) : $q->get($fields);
    }

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?CashCategory
    {
        $fields = $this->withRequiredColumns($fields);
        $q = CashCategory::query();
        $q = $this->applyRelation($q, $relations);

        return $q->findOrFail($id, $fields);
    }

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?CashCategory
    {
        $fields = $this->withRequiredColumns($fields);
        $q = CashCategory::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);

        return $q->first($fields);
    }

    public function create(array $data): ?CashCategory
    {
        return CashCategory::create($data);
    }

    public function update(CashCategory $cashCategory, array $data): ?CashCategory
    {
        $cashCategory->update($data);
        return $cashCategory;
    }

    public function delete(CashCategory $cashCategory): void
    {
        $cashCategory->delete();
    }
}