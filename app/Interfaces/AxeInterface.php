<?php

namespace App\Interfaces;

use App\Models\Axe;

interface AxeInterface{

    public function getAll(string|array|null $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc']);

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?Axe;

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?Axe;

    public function create(array $data): ?Axe;

    public function update(Axe $axe, array $data): ?Axe;

    public function delete(Axe $axe): void;
}
