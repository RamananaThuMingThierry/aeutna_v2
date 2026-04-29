<?php

namespace App\Repositories;

use App\Interfaces\DonationInterface;
use App\Models\Donation;

class DonationRepository extends BaseRepository implements DonationInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = [], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc'])
    {
        $fields = $this->withRequiredColumns($fields);

        $q = Donation::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);
        $q = $this->applyOrderBy($q, $orderBy);

        return $paginate ? $q->paginate($paginate, $fields) : $q->get($fields);
    }

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?Donation
    {
        $fields = $this->withRequiredColumns($fields);

        $q = Donation::query();
        $q = $this->applyRelation($q, $relations);

        return $q->findOrFail($id, $fields);
    }

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?Donation
    {
        $fields = $this->withRequiredColumns($fields);

        $q = Donation::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);

        return $q->first($fields);
    }

    public function create(array $data): ?Donation
    {
        return Donation::create($data);
    }

    public function update(Donation $donation, array $data): ?Donation
    {
        $donation->update($data);

        return $donation;
    }

    public function delete(Donation $donation): void
    {
        $donation->delete();
    }
}
