<?php

namespace App\Services;

use App\Interfaces\DonationInterface;
use App\Models\Donation;

class DonationService
{
    public function __construct(private DonationInterface $donationRepository) {}

    public function getAllDonations(
        string|array|null $keys = null,
        mixed $values = null,
        array $fields = ['*'],
        array $relations = [],
        ?int $paginate = null,
        array $orderBy = ['donation_date' => 'desc', 'id' => 'desc']
    ) {
        return $this->donationRepository->getAll($keys, $values, $fields, $relations, $paginate, $orderBy);
    }

    public function getByIdDonation(int|string|null $id, array $fields = ['*'], array $relations = []): ?Donation
    {
        return $this->donationRepository->getById($id, $fields, $relations);
    }

    public function createDonation(array $data): ?Donation
    {
        return $this->donationRepository->create($data);
    }

    public function updateDonation(Donation $donation, array $data): ?Donation
    {
        return $this->donationRepository->update($donation, $data);
    }

    public function deleteDonation(Donation $donation): void
    {
        $this->donationRepository->delete($donation);
    }
}
