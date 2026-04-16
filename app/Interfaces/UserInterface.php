<?php

namespace App\Interfaces;

use App\Models\User;

interface UserInterface{

    public function getAll(string|array|null $keys, mixed $values, array $fields = ['*'], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false, ?int $paginate = null, array $orderBy = ['id' => 'desc']);

    public function getById(int|string|null $id, array $fields = [], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false): ?User;

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false): ?User;

    public function create(array $data): ?User;

    public function update(User $user, array $data): ?User;

    public function delete(User $user): void;

    public function restore(int $id): ?User;

    public function forceDelete(int $id): void;
}
