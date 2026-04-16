<?php

namespace App\Services;

use App\Interfaces\UserInterface;
use App\Models\User;

class UserService
{
    public function __construct(private UserInterface $userRepository) {}

    public function getAllUsers(
        string|array|null $keys = null,
        mixed $values = null,
        array $fields = ['*'],
        array $relations = [],
        bool $withTrashed = false,
        bool $onlyTrashed = false,
        ?int $paginate = null,
        array $orderBy = ['id' => 'desc']
    ) {
        return $this->userRepository->getAll(
            $keys,
            $values,
            $fields,
            $relations,
            $withTrashed,
            $onlyTrashed,
            $paginate,
            $orderBy
        );
    }

    public function getByIdUser(
        int|string|null $id,
        array $fields = ['*'],
        array $relations = [],
        bool $withTrashed = false,
        bool $onlyTrashed = false
    ): ?User {
        return $this->userRepository->getById(
            $id,
            $fields,
            $relations,
            $withTrashed,
            $onlyTrashed
        );
    }

    public function getByKeysUser(
        string|array|null $keys,
        mixed $values,
        array $fields = ['*'],
        array $relations = [],
        bool $withTrashed = false,
        bool $onlyTrashed = false
    ): ?User {
        return $this->userRepository->getByKeys(
            $keys,
            $values,
            $fields,
            $relations,
            $withTrashed,
            $onlyTrashed
        );
    }

    public function createUser(array $data): ?User
    {
        return $this->userRepository->create($data);
    }

    public function updateUser(User $user, array $data): ?User
    {
        return $this->userRepository->update($user, $data);
    }

    public function deleteUser(User $user): void
    {
        $this->userRepository->delete($user);
    }

    public function restoreUser(int $id): ?User
    {
        return $this->userRepository->restore($id);
    }

    public function forceDeleteUser(int $id): void
    {
        $this->userRepository->forceDelete($id);
    }
}
