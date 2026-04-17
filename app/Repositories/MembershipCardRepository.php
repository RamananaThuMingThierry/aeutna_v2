<?php

namespace App\Repositories;

use App\Interfaces\MembershipCardInterface;
use App\Models\MembershipCard;

class MembershipCardRepository extends BaseRepository implements MembershipCardInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = [], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc'])
    {
        $fields = $this->withRequiredColumns($fields);

        $q = MembershipCard::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);
        $q = $this->applyOrderBy($q, $orderBy);

        return $paginate ? $q->paginate($paginate, $fields) : $q->get($fields);
    }

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?MembershipCard
    {
        $fields = $this->withRequiredColumns($fields);

        $q = MembershipCard::query();
        $q = $this->applyRelation($q, $relations);

        return $q->findOrFail($id, $fields);
    }

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?MembershipCard
    {
        $fields = $this->withRequiredColumns($fields);

        $q = MembershipCard::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);

        return $q->first($fields);
    }

    public function create(array $data): ?MembershipCard
    {
        return MembershipCard::create($data);
    }

    public function update(MembershipCard $membershipCard, array $data): ?MembershipCard
    {
        $membershipCard->update($data);
        return $membershipCard;
    }

    public function delete(MembershipCard $membershipCard): void
    {
        $membershipCard->delete();
    }
}
