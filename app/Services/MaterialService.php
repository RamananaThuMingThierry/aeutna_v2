<?php

namespace App\Services;

use App\Interfaces\MaterialInterface;
use App\Models\Material;

class MaterialService
{
    public function __construct(private MaterialInterface $materialRepository) {}

    public function getAllMaterials(
        string|array|null $keys = null,
        mixed $values = null,
        array $fields = ['*'],
        array $relations = [],
        ?int $paginate = null,
        array $orderBy = ['id' => 'desc']
    ) {
        return $this->materialRepository->getAll(
            $keys,
            $values,
            $fields,
            $relations,
            $paginate,
            $orderBy
        );
    }

    public function getByIdMaterial(
        int|string|null $id,
        array $fields = ['*'],
        array $relations = []
    ): ?Material {
        return $this->materialRepository->getById($id, $fields, $relations);
    }

    public function getByKeysMaterial(
        string|array|null $keys,
        mixed $values,
        array $fields = ['*'],
        array $relations = []
    ): ?Material {
        return $this->materialRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function createMaterial(array $data): ?Material
    {
        return $this->materialRepository->create($this->normalizePayload($data));
    }

    public function updateMaterial(Material $material, array $data): ?Material
    {
        return $this->materialRepository->update($material, $this->normalizePayload($data));
    }

    public function deleteMaterial(Material $material): void
    {
        $this->materialRepository->delete($material);
    }

    private function normalizePayload(array $data): array
    {
        $payload = [
            'name' => $data['name'] ?? null,
            'reference' => $data['reference'] ?? null,
            'category' => $data['category'] ?? null,
            'description' => $data['description'] ?? null,
            'quantity_total' => $data['quantity_total'] ?? null,
            'quantity_available' => $data['quantity_available'] ?? null,
            'condition_status' => $data['condition_status'] ?? null,
            'status' => $data['status'] ?? null,
            'storage_location' => $data['storage_location'] ?? null,
            'acquired_at' => $data['acquired_at'] ?? null,
            'acquisition_cost' => $data['acquisition_cost'] ?? null,
            'notes' => $data['notes'] ?? null,
        ];

        if (array_key_exists('created_by', $data)) {
            $payload['created_by'] = $data['created_by'];
        }

        return array_filter(
            $payload,
            fn ($value, $key) => $value !== null || array_key_exists($key, $data),
            ARRAY_FILTER_USE_BOTH
        );
    }
}
