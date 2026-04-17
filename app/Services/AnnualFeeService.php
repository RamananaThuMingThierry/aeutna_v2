<?php

namespace App\Services;

use App\Interfaces\AnnualFeeInterface;
use App\Models\AnnualFee;

class AnnualFeeService
{
    public function __construct(private AnnualFeeInterface $annualFeeRepository) {}

    public function getAllAnnualFees(
        string|array|null $keys = null,
        mixed $values = null,
        array $fields = ['*'],
        array $relations = [],
        ?int $paginate = null,
        array $orderBy = ['year' => 'desc']
    ) {
        return $this->annualFeeRepository->getAll($keys, $values, $fields, $relations, $paginate, $orderBy);
    }

    public function getByIdAnnualFee(int|string|null $id, array $fields = ['*'], array $relations = []): ?AnnualFee
    {
        return $this->annualFeeRepository->getById($id, $fields, $relations);
    }

    public function createAnnualFee(array $data): ?AnnualFee
    {
        return $this->annualFeeRepository->create($data);
    }

    public function updateAnnualFee(AnnualFee $annualFee, array $data): ?AnnualFee
    {
        return $this->annualFeeRepository->update($annualFee, $data);
    }

    public function deleteAnnualFee(AnnualFee $annualFee): void
    {
        $this->annualFeeRepository->delete($annualFee);
    }
}
