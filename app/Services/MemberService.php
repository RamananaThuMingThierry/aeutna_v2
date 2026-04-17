<?php

namespace App\Services;

use App\Interfaces\MemberInterface;
use App\Models\Functions;
use App\Models\Member;
use App\Models\MemberApplication;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MemberService
{
    public function __construct(private MemberInterface $memberRepository) {}

    public function getAllMembers(
        string|array|null $keys = null,
        mixed $values = null,
        array $fields = ['*'],
        array $relations = [],
        bool $withTrashed = false,
        bool $onlyTrashed = false,
        ?int $paginate = null,
        array $orderBy = ['id' => 'desc']
    ) {
        return $this->memberRepository->getAll(
            $keys,
            $values,
            $fields,
            $relations,
            $withTrashed,
            $onlyTrashed,
            $paginate,
            $orderBy
        );
    }

    public function getByIdMember(
        int|string|null $id,
        array $fields = ['*'],
        array $relations = [],
        bool $withTrashed = false,
        bool $onlyTrashed = false
    ): ?Member {
        return $this->memberRepository->getById(
            $id,
            $fields,
            $relations,
            $withTrashed,
            $onlyTrashed
        );
    }

    public function getByKeysMember(
        string|array|null $keys,
        mixed $values,
        array $fields = ['*'],
        array $relations = [],
        bool $withTrashed = false,
        bool $onlyTrashed = false
    ): ?Member {
        return $this->memberRepository->getByKeys(
            $keys,
            $values,
            $fields,
            $relations,
            $withTrashed,
            $onlyTrashed
        );
    }

    public function createMember(array $data): ?Member
    {
        return DB::transaction(function () use ($data) {
            [$memberData, $functionData] = $this->extractAssociationData($data);

            $memberData['member_type'] = $memberData['member_type'] ?? 'member';

            $member = $this->memberRepository->create($memberData);

            $this->syncMemberFunctions($member, $memberData['member_type'], $functionData);
            $this->syncMemberApplicationType($member->application_id, $memberData['member_type']);

            return $member->fresh(['currentMemberFunction.function', 'currentMemberFunctions.function']);
        });
    }

    public function getNextMemberNumber(): string
    {
        $memberNumbers = Member::withTrashed()
            ->whereNotNull('member_number')
            ->pluck('member_number');

        $maxNumber = $memberNumbers
            ->map(function (mixed $value): int {
                $number = preg_replace('/\D+/', '', (string) $value);
                return $number !== '' ? (int) $number : 0;
            })
            ->max();

        return (string) (($maxNumber ?? 0) + 1);
    }

    public function updateMember(Member $member, array $data): ?Member
    {
        return DB::transaction(function () use ($member, $data) {
            [$memberData, $functionData] = $this->extractAssociationData($data);

            $memberType = $memberData['member_type'] ?? $member->member_type ?? 'member';
            $memberData['member_type'] = $memberType;

            $member = $this->memberRepository->update($member, $memberData);

            $this->syncMemberFunctions($member, $memberType, $functionData);
            $this->syncMemberApplicationType($member->application_id, $memberType);

            return $member->fresh(['currentMemberFunction.function', 'currentMemberFunctions.function']);
        });
    }

    public function deleteMember(Member $member): void
    {
        $this->memberRepository->delete($member);
    }

    public function restoreMember(int $id): ?Member
    {
        return $this->memberRepository->restore($id);
    }

    public function forceDeleteMember(int $id): void
    {
        $this->memberRepository->forceDelete($id);
    }

    private function extractAssociationData(array $data): array
    {
        $functionData = [
            'function_ids' => array_values(array_filter($data['function_ids'] ?? [], fn ($value) => filled($value))),
            'start_date' => $data['function_start_date'] ?? null,
            'end_date' => $data['function_end_date'] ?? null,
            'notes' => $data['function_notes'] ?? null,
        ];

        unset(
            $data['function_ids'],
            $data['function_start_date'],
            $data['function_end_date'],
            $data['function_notes']
        );

        return [$data, $functionData];
    }

    private function syncMemberFunctions(Member $member, string $memberType, array $functionData): void
    {
        $currentAssignments = $member->memberFunctions()->where('is_current', true)->get();

        if ($memberType !== 'bureau') {
            foreach ($currentAssignments as $assignment) {
                $assignment->update([
                    'is_current' => false,
                    'end_date' => $assignment->end_date ?? now()->toDateString(),
                ]);
            }

            return;
        }

        $functionIds = collect($functionData['function_ids'] ?? [])
            ->map(fn ($value) => (int) $value)
            ->filter()
            ->unique()
            ->values();

        if ($functionIds->isEmpty()) {
            throw ValidationException::withMessages([
                'function_ids' => ['Au moins une fonction du bureau est obligatoire pour un membre de type bureau.'],
            ]);
        }

        $functions = Functions::query()->whereIn('id', $functionIds)->get()->keyBy('id');

        foreach ($functionIds as $functionId) {
            $function = $functions->get($functionId);

            if (!$function || !$function->is_executive) {
                throw ValidationException::withMessages([
                    'function_ids' => ['Une des fonctions selectionnees ne correspond pas a une fonction de bureau.'],
                ]);
            }
        }

        $startDate = $functionData['start_date'] ?: ($member->joined_at?->toDateString() ?? now()->toDateString());
        $currentAssignments->each(function ($assignment) use ($functionIds, $startDate, $functionData) {
            if ($functionIds->contains((int) $assignment->function_id)) {
                $assignment->update([
                    'start_date' => $startDate,
                    'end_date' => $functionData['end_date'] ?: null,
                    'notes' => $functionData['notes'] ?: null,
                    'is_current' => true,
                ]);
                return;
            }

            $assignment->update([
                'is_current' => false,
                'end_date' => $assignment->end_date ?? $startDate,
            ]);
        });

        $existingCurrentIds = $currentAssignments->pluck('function_id')->map(fn ($value) => (int) $value);

        $functionIds
            ->diff($existingCurrentIds)
            ->each(function ($functionId) use ($member, $startDate, $functionData) {
                $member->memberFunctions()->create([
                    'function_id' => $functionId,
                    'start_date' => $startDate,
                    'end_date' => $functionData['end_date'] ?: null,
                    'notes' => $functionData['notes'] ?: null,
                    'is_current' => true,
                ]);
            });
    }

    private function syncMemberApplicationType(?int $applicationId, string $memberType): void
    {
        if (!$applicationId) {
            return;
        }

        MemberApplication::query()
            ->whereKey($applicationId)
            ->update(['member_type' => $memberType]);
    }
}
