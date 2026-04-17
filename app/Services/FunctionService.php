<?php

namespace App\Services;

use App\Interfaces\FunctionInterface;
use App\Models\Functions;

class FunctionService
{
    public function __construct(private FunctionInterface $functionRepository) {}

    public function getAllFunctions(
        string|array|null $keys = null,
        mixed $values = null,
        array $fields = ['*'],
        array $relations = [],
        ?int $paginate = null,
        array $orderBy = ['id' => 'desc']
    ) {
        return $this->functionRepository->getAll(
            $keys,
            $values,
            $fields,
            $relations,
            $paginate,
            $orderBy
        );
    }

    public function getByIdFunction(
        int|string|null $id,
        array $fields = ['*'],
        array $relations = []
    ): ?Functions {
        return $this->functionRepository->getById($id, $fields, $relations);
    }

    public function getByKeysFunction(
        string|array|null $keys,
        mixed $values,
        array $fields = ['*'],
        array $relations = []
    ): ?Functions {
        return $this->functionRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function createFunction(array $data): ?Functions
    {
        return $this->functionRepository->create($data);
    }

    public function updateFunction(Functions $function, array $data): ?Functions
    {
        return $this->functionRepository->update($function, $data);
    }

    public function deleteFunction(Functions $function): void
    {
        $this->functionRepository->delete($function);
    }
}
