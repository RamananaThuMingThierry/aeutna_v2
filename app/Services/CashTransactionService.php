<?php

namespace App\Services;

use App\Interfaces\CashTransactionInterface;
use App\Models\CashTransaction;

class CashTransactionService
{
    public function __construct(private CashTransactionInterface $cashTransactionRepository) {}

    public function getAllCashTransactions(string|array|null $keys = null, mixed $values = null, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['transaction_date' => 'desc', 'id' => 'desc'])
    {
        return $this->cashTransactionRepository->getAll($keys, $values, $fields, $relations, $paginate, $orderBy);
    }

    public function getByIdCashTransaction(int|string|null $id, array $fields = ['*'], array $relations = []): ?CashTransaction
    {
        return $this->cashTransactionRepository->getById($id, $fields, $relations);
    }

    public function createCashTransaction(array $data): ?CashTransaction
    {
        return $this->cashTransactionRepository->create($data);
    }

    public function updateCashTransaction(CashTransaction $cashTransaction, array $data): ?CashTransaction
    {
        return $this->cashTransactionRepository->update($cashTransaction, $data);
    }

    public function deleteCashTransaction(CashTransaction $cashTransaction): void
    {
        $this->cashTransactionRepository->delete($cashTransaction);
    }
}