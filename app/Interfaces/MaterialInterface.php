<?php

namespace App\Interfaces;

use App\Models\Material;

interface MaterialInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc']);

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?Material;

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?Material;

    public function create(array $data): ?Material;

    public function update(Material $material, array $data): ?Material;

    public function delete(Material $material): void;
}
