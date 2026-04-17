<?php

namespace App\Interfaces;

use App\Models\Functions;

interface FunctionInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc']);

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?Functions;

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?Functions;

    public function create(array $data): ?Functions;

    public function update(Functions $function, array $data): ?Functions;

    public function delete(Functions $function): void;
}
