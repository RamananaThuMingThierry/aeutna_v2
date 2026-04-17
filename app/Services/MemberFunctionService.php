<?php

namespace App\Services;

use App\Interfaces\MemberFunctionInterface;
use App\Models\MemberFunction;

class MemberFunctionService
{
    public function __construct(private MemberFunctionInterface $memberFunctionRepository) {}

    public function getAllMemberFunctions(
        string|array|null $keys = null,
        mixed $values = null,
        array $fields = ['*'],
        array $relations = [],
        ?int $paginate = null,
        array $orderBy = ['id' => 'desc']
    ) {
        return $this->memberFunctionRepository->getAll(
            $keys,
            $values,
            $fields,
            $relations,
            $paginate,
            $orderBy
        );
    }

    public function getByIdMemberFunction(
        int|string|null $id,
        array $fields = ['*'],
        array $relations = []
    ): ?MemberFunction {
        return $this->memberFunctionRepository->getById($id, $fields, $relations);
    }

    public function createMemberFunction(array $data): ?MemberFunction
    {
        return $this->memberFunctionRepository->create($data);
    }

    public function updateMemberFunction(MemberFunction $memberFunction, array $data): ?MemberFunction
    {
        return $this->memberFunctionRepository->update($memberFunction, $data);
    }

    public function deleteMemberFunction(MemberFunction $memberFunction): void
    {
        $this->memberFunctionRepository->delete($memberFunction);
    }
}
