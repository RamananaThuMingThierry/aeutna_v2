<?php

namespace App\Interfaces;

use App\Models\Donation;

interface DonationInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc']);

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?Donation;

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?Donation;

    public function create(array $data): ?Donation;

    public function update(Donation $donation, array $data): ?Donation;

    public function delete(Donation $donation): void;
}
