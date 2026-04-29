<?php

namespace App\Interfaces;

use App\Models\MaterialMaintenance;

interface MaterialMaintenanceInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc']);

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?MaterialMaintenance;

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?MaterialMaintenance;

    public function create(array $data): ?MaterialMaintenance;

    public function update(MaterialMaintenance $materialMaintenance, array $data): ?MaterialMaintenance;

    public function delete(MaterialMaintenance $materialMaintenance): void;
}
