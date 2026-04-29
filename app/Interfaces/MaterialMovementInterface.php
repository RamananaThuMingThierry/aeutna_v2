<?php

namespace App\Interfaces;

use App\Models\MaterialMovement;

interface MaterialMovementInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc']);

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?MaterialMovement;

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?MaterialMovement;

    public function create(array $data): ?MaterialMovement;

    public function update(MaterialMovement $materialMovement, array $data): ?MaterialMovement;

    public function delete(MaterialMovement $materialMovement): void;
}
