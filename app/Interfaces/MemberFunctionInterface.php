<?php

namespace App\Interfaces;

use App\Models\MemberFunction;

interface MemberFunctionInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc']);

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?MemberFunction;

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?MemberFunction;

    public function create(array $data): ?MemberFunction;

    public function update(MemberFunction $memberFunction, array $data): ?MemberFunction;

    public function delete(MemberFunction $memberFunction): void;
}
