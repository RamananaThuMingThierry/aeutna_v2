<?php

namespace App\Interfaces;

use App\Models\AnnualFee;

interface AnnualFeeInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc']);

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?AnnualFee;

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?AnnualFee;

    public function create(array $data): ?AnnualFee;

    public function update(AnnualFee $annualFee, array $data): ?AnnualFee;

    public function delete(AnnualFee $annualFee): void;
}
