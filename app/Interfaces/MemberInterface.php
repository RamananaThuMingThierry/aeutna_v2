<?php

namespace App\Interfaces;

use App\Models\Member;

interface MemberInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = ['*'], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false, ?int $paginate = null, array $orderBy = ['id' => 'desc']);

    public function getById(int|string|null $id, array $fields = [], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false): ?Member;

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false): ?Member;

    public function create(array $data): ?Member;

    public function update(Member $member, array $data): ?Member;

    public function delete(Member $member): void;

    public function restore(int $id): ?Member;

    public function forceDelete(int $id): void;
}
