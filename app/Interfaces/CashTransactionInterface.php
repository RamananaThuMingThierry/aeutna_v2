<?php

namespace App\Interfaces;

use App\Models\CashTransaction;

interface CashTransactionInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc']);

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?CashTransaction;

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?CashTransaction;

    public function create(array $data): ?CashTransaction;

    public function update(CashTransaction $cashTransaction, array $data): ?CashTransaction;

    public function delete(CashTransaction $cashTransaction): void;
}