<?php

namespace App\Services;

use App\Interfaces\SupplierInterface;
use App\Models\Supplier;

class SupplierService
{
    public function __construct(private SupplierInterface $supplierRepository) {}

    public function getAllSuppliers(
        string|array|null $keys = null,
        mixed $values = null,
        array $fields = ['*'],
        array $relations = [],
        ?int $paginate = null,
        array $orderBy = ['id' => 'desc']
    ) {
        return $this->supplierRepository->getAll($keys, $values, $fields, $relations, $paginate, $orderBy);
    }

    public function getByIdSupplier(int|string|null $id, array $fields = ['*'], array $relations = []): ?Supplier
    {
        return $this->supplierRepository->getById($id, $fields, $relations);
    }

    public function createSupplier(array $data): ?Supplier
    {
        return $this->supplierRepository->create($data);
    }

    public function updateSupplier(Supplier $supplier, array $data): ?Supplier
    {
        return $this->supplierRepository->update($supplier, $data);
    }

    public function deleteSupplier(Supplier $supplier): void
    {
        $this->supplierRepository->delete($supplier);
    }
}
