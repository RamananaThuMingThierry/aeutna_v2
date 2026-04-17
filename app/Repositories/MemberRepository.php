<?php

namespace App\Repositories;

use App\Interfaces\MemberInterface;
use App\Models\Member;

class MemberRepository extends BaseRepository implements MemberInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = [], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false, ?int $paginate = null, array $orderBy = ['id' => 'desc'])
    {
        $fields = $this->withRequiredColumns($fields);

        $q = Member::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyTrashed($q, $withTrashed, $onlyTrashed);
        $q = $this->applyFilter($q, $keys, $values);
        $q = $this->applyOrderBy($q, $orderBy);

        return $paginate ? $q->paginate($paginate, $fields) : $q->get($fields);
    }

    public function getById(int|string|null $id, array $fields = [], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false): ?Member
    {
        $fields = $this->withRequiredColumns($fields);

        $q = Member::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyTrashed($q, $withTrashed, $onlyTrashed);

        return $q->findOrFail($id, $fields);
    }

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = [], bool $withTrashed = false, bool $onlyTrashed = false): ?Member
    {
        $fields = $this->withRequiredColumns($fields);

        $q = Member::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyTrashed($q, $withTrashed, $onlyTrashed);
        $q = $this->applyFilter($q, $keys, $values);

        return $q->first($fields);
    }

    public function create(array $data): ?Member
    {
        return Member::create($data);
    }

    public function update(Member $member, array $data): ?Member
    {
        $member->update($data);
        return $member;
    }

    public function delete(Member $member): void
    {
        $member->delete();
    }

    public function restore(int $id): ?Member
    {
        $member = Member::withTrashed()->find($id);
        if ($member && $member->trashed()) {
            $member->restore();
        }

        return $member?->fresh();
    }

    public function forceDelete(int $id): void
    {
        $member = Member::withTrashed()->find($id);
        if ($member) {
            $member->forceDelete();
        }
    }
}
