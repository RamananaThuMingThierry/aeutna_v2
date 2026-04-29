<?php

namespace App\Services;

use App\Interfaces\MaterialMovementInterface;
use App\Models\MaterialMovement;

class MaterialMovementService
{
    public function __construct(private MaterialMovementInterface $materialMovementRepository) {}

    public function getAllMaterialMovements(
        string|array|null $keys = null,
        mixed $values = null,
        array $fields = ['*'],
        array $relations = [],
        ?int $paginate = null,
        array $orderBy = ['movement_date' => 'desc', 'id' => 'desc']
    ) {
        return $this->materialMovementRepository->getAll($keys, $values, $fields, $relations, $paginate, $orderBy);
    }

    public function getByIdMaterialMovement(int|string|null $id, array $fields = ['*'], array $relations = []): ?MaterialMovement
    {
        return $this->materialMovementRepository->getById($id, $fields, $relations);
    }

    public function createMaterialMovement(array $data): ?MaterialMovement
    {
        return $this->materialMovementRepository->create($data);
    }

    public function updateMaterialMovement(MaterialMovement $materialMovement, array $data): ?MaterialMovement
    {
        return $this->materialMovementRepository->update($materialMovement, $data);
    }

    public function deleteMaterialMovement(MaterialMovement $materialMovement): void
    {
        $this->materialMovementRepository->delete($materialMovement);
    }
}
