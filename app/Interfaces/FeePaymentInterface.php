<?php

namespace App\Interfaces;

use App\Models\FeePayment;

interface FeePaymentInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc']);

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?FeePayment;

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?FeePayment;

    public function create(array $data): ?FeePayment;

    public function update(FeePayment $feePayment, array $data): ?FeePayment;

    public function delete(FeePayment $feePayment): void;
}
