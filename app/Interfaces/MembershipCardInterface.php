<?php

namespace App\Interfaces;

use App\Models\MembershipCard;

interface MembershipCardInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc']);

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?MembershipCard;

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?MembershipCard;

    public function create(array $data): ?MembershipCard;

    public function update(MembershipCard $membershipCard, array $data): ?MembershipCard;

    public function delete(MembershipCard $membershipCard): void;
}
