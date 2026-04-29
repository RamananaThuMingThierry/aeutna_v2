<?php

namespace App\Interfaces;

use App\Models\MaterialLoan;

interface MaterialLoanInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc']);

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?MaterialLoan;

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?MaterialLoan;

    public function create(array $data): ?MaterialLoan;

    public function update(MaterialLoan $materialLoan, array $data): ?MaterialLoan;

    public function delete(MaterialLoan $materialLoan): void;
}
