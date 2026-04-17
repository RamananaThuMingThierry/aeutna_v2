<?php

namespace App\Services;

use App\Interfaces\MembershipCardInterface;
use App\Models\Member;
use App\Models\MembershipCard;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MembershipCardService
{
    public function __construct(private MembershipCardInterface $membershipCardRepository) {}

    public function getAllMembershipCards(
        string|array|null $keys = null,
        mixed $values = null,
        array $fields = ['*'],
        array $relations = [],
        ?int $paginate = null,
        array $orderBy = ['id' => 'desc']
    ) {
        return $this->membershipCardRepository->getAll($keys, $values, $fields, $relations, $paginate, $orderBy);
    }

    public function getByIdMembershipCard(int|string|null $id, array $fields = ['*'], array $relations = []): ?MembershipCard
    {
        return $this->membershipCardRepository->getById($id, $fields, $relations);
    }

    public function createMembershipCard(array $data): ?MembershipCard
    {
        return DB::transaction(function () use ($data) {
            $data = $this->prepareMembershipCardData($data);
            return $this->membershipCardRepository->create($data);
        });
    }

    public function updateMembershipCard(MembershipCard $membershipCard, array $data): ?MembershipCard
    {
        return DB::transaction(function () use ($membershipCard, $data) {
            $data = $this->prepareMembershipCardData($data, $membershipCard);
            return $this->membershipCardRepository->update($membershipCard, $data);
        });
    }

    public function deleteMembershipCard(MembershipCard $membershipCard): void
    {
        $this->membershipCardRepository->delete($membershipCard);
    }

    private function prepareMembershipCardData(array $data, ?MembershipCard $existing = null): array
    {
        if ($existing) {
            $data['member_id'] = $existing->member_id;
        }

        $memberId = (int) ($data['member_id'] ?? $existing?->member_id ?? 0);
        $member = Member::query()->find($memberId);

        if (!$member) {
            throw ValidationException::withMessages([
                'member_id' => ['Le membre selectionne est introuvable.'],
            ]);
        }

        if (blank($member->member_number)) {
            throw ValidationException::withMessages([
                'member_id' => ['Le membre selectionne ne possede pas de numero membre.'],
            ]);
        }

        $data['card_number'] = (string) $member->member_number;
        $data['qr_code'] = (string) $member->member_number;

        if (blank($data['issue_year'] ?? null)) {
            $issuedAt = $data['issued_at'] ?? $existing?->issued_at?->toDateString() ?? now()->toDateString();
            $data['issue_year'] = (int) date('Y', strtotime((string) $issuedAt));
        }

        if (blank($data['issued_at'] ?? null) && !$existing) {
            $data['issued_at'] = now()->toDateString();
        }

        $data['status'] = $data['status'] ?? $existing?->status ?? 'active';

        return $data;
    }
}
