<?php

namespace App\Interfaces;

use App\Models\CashCategory;

interface CashCategoryInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc']);

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?CashCategory;

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?CashCategory;

    public function create(array $data): ?CashCategory;

    public function update(CashCategory $cashCategory, array $data): ?CashCategory;

    public function delete(CashCategory $cashCategory): void;
}