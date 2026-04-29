<?php

namespace App\Services;

use App\Interfaces\CashCategoryInterface;
use App\Models\CashCategory;

class CashCategoryService
{
    public function __construct(private CashCategoryInterface $cashCategoryRepository) {}

    public function getAllCashCategories(string|array|null $keys = null, mixed $values = null, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc'])
    {
        return $this->cashCategoryRepository->getAll($keys, $values, $fields, $relations, $paginate, $orderBy);
    }

    public function getByIdCashCategory(int|string|null $id, array $fields = ['*'], array $relations = []): ?CashCategory
    {
        return $this->cashCategoryRepository->getById($id, $fields, $relations);
    }

    public function createCashCategory(array $data): ?CashCategory
    {
        return $this->cashCategoryRepository->create($data);
    }

    public function updateCashCategory(CashCategory $cashCategory, array $data): ?CashCategory
    {
        return $this->cashCategoryRepository->update($cashCategory, $data);
    }

    public function deleteCashCategory(CashCategory $cashCategory): void
    {
        $this->cashCategoryRepository->delete($cashCategory);
    }
}