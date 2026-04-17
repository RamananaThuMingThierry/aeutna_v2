<?php

namespace App\Services;

use App\Interfaces\AxeInterface;
use App\Models\Axe;

class AxeService
{
    public function __construct(private AxeInterface $axeRepository) {}

    public function getAllAxes(
        string|array|null $keys = null,
        mixed $values = null,
        array $fields = ['*'],
        array $relations = [],
        ?int $paginate = null,
        array $orderBy = ['id' => 'desc']
    ) {
        return $this->axeRepository->getAll(
            $keys,
            $values,
            $fields,
            $relations,
            $paginate,
            $orderBy
        );
    }

    public function getByIdAxe(
        int|string|null $id,
        array $fields = ['*'],
        array $relations = []
    ): ?Axe {
        return $this->axeRepository->getById($id, $fields, $relations);
    }

    public function getByKeysAxe(
        string|array|null $keys,
        mixed $values,
        array $fields = ['*'],
        array $relations = []
    ): ?Axe {
        return $this->axeRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function createAxe(array $data): ?Axe
    {
        return $this->axeRepository->create($data);
    }

    public function updateAxe(Axe $axe, array $data): ?Axe
    {
        return $this->axeRepository->update($axe, $data);
    }

    public function deleteAxe(Axe $axe): void
    {
        $this->axeRepository->delete($axe);
    }
}
