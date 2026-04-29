<?php

namespace App\Interfaces;

use App\Models\Supplier;

interface SupplierInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc']);

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?Supplier;

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?Supplier;

    public function create(array $data): ?Supplier;

    public function update(Supplier $supplier, array $data): ?Supplier;

    public function delete(Supplier $supplier): void;
}
