<?php

namespace App\Services;

use App\Interfaces\MaterialMaintenanceInterface;
use App\Models\MaterialMaintenance;

class MaterialMaintenanceService
{
    public function __construct(private MaterialMaintenanceInterface $materialMaintenanceRepository) {}

    public function getAllMaterialMaintenances(
        string|array|null $keys = null,
        mixed $values = null,
        array $fields = ['*'],
        array $relations = [],
        ?int $paginate = null,
        array $orderBy = ['maintenance_date' => 'desc', 'id' => 'desc']
    ) {
        return $this->materialMaintenanceRepository->getAll($keys, $values, $fields, $relations, $paginate, $orderBy);
    }

    public function getByIdMaterialMaintenance(int|string|null $id, array $fields = ['*'], array $relations = []): ?MaterialMaintenance
    {
        return $this->materialMaintenanceRepository->getById($id, $fields, $relations);
    }

    public function createMaterialMaintenance(array $data): ?MaterialMaintenance
    {
        return $this->materialMaintenanceRepository->create($data);
    }

    public function updateMaterialMaintenance(MaterialMaintenance $materialMaintenance, array $data): ?MaterialMaintenance
    {
        return $this->materialMaintenanceRepository->update($materialMaintenance, $data);
    }

    public function deleteMaterialMaintenance(MaterialMaintenance $materialMaintenance): void
    {
        $this->materialMaintenanceRepository->delete($materialMaintenance);
    }
}
