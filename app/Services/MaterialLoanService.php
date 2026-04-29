<?php

namespace App\Services;

use App\Interfaces\MaterialLoanInterface;
use App\Models\Material;
use App\Models\MaterialLoan;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MaterialLoanService
{
    private const RESERVED_STATUSES = ['ongoing', 'late', 'lost'];

    public function __construct(
        private MaterialLoanInterface $materialLoanRepository,
        private MaterialMovementService $materialMovementService
    ) {}

    public function getAllMaterialLoans(
        string|array|null $keys = null,
        mixed $values = null,
        array $fields = ['*'],
        array $relations = [],
        ?int $paginate = null,
        array $orderBy = ['loaned_at' => 'desc', 'id' => 'desc']
    ) {
        return $this->materialLoanRepository->getAll($keys, $values, $fields, $relations, $paginate, $orderBy);
    }

    public function getByIdMaterialLoan(int|string|null $id, array $fields = ['*'], array $relations = []): ?MaterialLoan
    {
        return $this->materialLoanRepository->getById($id, $fields, $relations);
    }

    public function createMaterialLoan(array $data): ?MaterialLoan
    {
        return DB::transaction(function () use ($data) {
            $material = Material::query()->lockForUpdate()->findOrFail($data['material_id']);
            $quantity = (int) $data['quantity'];
            $status = $data['status'] ?? 'ongoing';

            $this->ensureMaterialCanBeReserved($material, $quantity, $status);

            $loan = $this->materialLoanRepository->create($this->normalizePayload($data));

            if ($this->reservesInventory($status)) {
                $this->updateMaterialAvailability($material, -$quantity);
                $this->createMovementFromLoan($loan, 'loan', $quantity);
            }

            return $loan->fresh(['material', 'member', 'approver', 'creator', 'movements']);
        });
    }

    public function updateMaterialLoan(MaterialLoan $materialLoan, array $data): ?MaterialLoan
    {
        return DB::transaction(function () use ($materialLoan, $data) {
            $materialLoan->loadMissing('material');
            $material = Material::query()->lockForUpdate()->findOrFail($materialLoan->material_id);

            $normalized = $this->normalizePayload($data, $materialLoan);
            $oldReserved = $this->reservesInventory($materialLoan->status) ? $materialLoan->quantity : 0;
            $newReserved = $this->reservesInventory($normalized['status']) ? (int) $normalized['quantity'] : 0;
            $delta = $newReserved - $oldReserved;

            if ($delta > 0) {
                $this->ensureMaterialCanBeReserved($material, $delta, $normalized['status']);
                $this->updateMaterialAvailability($material, -$delta);

                if ($normalized['status'] === $materialLoan->status) {
                    $this->createMovementFromLoan($materialLoan, 'loan', $delta);
                }
            } elseif ($delta < 0) {
                $this->updateMaterialAvailability($material, abs($delta));

                if ($normalized['status'] === 'returned') {
                    $this->createMovementFromLoan($materialLoan, 'return', abs($delta));
                }
            }

            $wasReserved = $this->reservesInventory($materialLoan->status);
            $isReturnedNow = $normalized['status'] === 'returned' && $materialLoan->status !== 'returned';

            $materialLoan = $this->materialLoanRepository->update($materialLoan, $normalized);

            if ($wasReserved && $isReturnedNow && $oldReserved > 0 && $delta === 0) {
                $this->createMovementFromLoan($materialLoan, 'return', $oldReserved);
            }

            return $materialLoan->fresh(['material', 'member', 'approver', 'creator', 'movements']);
        });
    }

    public function returnMaterialLoan(MaterialLoan $materialLoan, ?string $returnedAt = null, ?string $notes = null): ?MaterialLoan
    {
        return $this->updateMaterialLoan($materialLoan, array_filter([
            'status' => 'returned',
            'returned_at' => $returnedAt ?? now()->toDateTimeString(),
            'notes' => $notes ?? $materialLoan->notes,
        ], fn ($value) => $value !== null));
    }

    public function deleteMaterialLoan(MaterialLoan $materialLoan): void
    {
        DB::transaction(function () use ($materialLoan) {
            $material = Material::query()->lockForUpdate()->findOrFail($materialLoan->material_id);

            if ($this->reservesInventory($materialLoan->status)) {
                $this->updateMaterialAvailability($material, $materialLoan->quantity);
            }

            $this->materialLoanRepository->delete($materialLoan);
        });
    }

    private function normalizePayload(array $data, ?MaterialLoan $existing = null): array
    {
        $payload = [
            'material_id' => $data['material_id'] ?? $existing?->material_id,
            'member_id' => $data['member_id'] ?? $existing?->member_id,
            'quantity' => (int) ($data['quantity'] ?? $existing?->quantity ?? 1),
            'loaned_at' => $data['loaned_at'] ?? $existing?->loaned_at,
            'expected_return_at' => $data['expected_return_at'] ?? $existing?->expected_return_at,
            'returned_at' => $data['returned_at'] ?? $existing?->returned_at,
            'status' => $data['status'] ?? $existing?->status ?? 'ongoing',
            'notes' => $data['notes'] ?? $existing?->notes,
            'approved_by' => $data['approved_by'] ?? $existing?->approved_by,
            'created_by' => $data['created_by'] ?? $existing?->created_by,
        ];

        if ($payload['status'] === 'returned' && empty($payload['returned_at'])) {
            $payload['returned_at'] = now();
        }

        if ($payload['status'] !== 'returned' && array_key_exists('returned_at', $data) && $data['returned_at'] === null) {
            $payload['returned_at'] = null;
        }

        return $payload;
    }

    private function reservesInventory(string $status): bool
    {
        return in_array($status, self::RESERVED_STATUSES, true);
    }

    private function ensureMaterialCanBeReserved(Material $material, int $quantity, string $status): void
    {
        if (!$this->reservesInventory($status)) {
            return;
        }

        if ($quantity > $material->quantity_available) {
            throw ValidationException::withMessages([
                'quantity' => ['La quantite demandee depasse la quantite disponible du material.'],
            ]);
        }
    }

    private function updateMaterialAvailability(Material $material, int $delta): void
    {
        $newAvailable = $material->quantity_available + $delta;

        if ($newAvailable < 0 || $newAvailable > $material->quantity_total) {
            throw ValidationException::withMessages([
                'quantity_available' => ['La quantite disponible du material deviendrait invalide.'],
            ]);
        }

        $status = $material->status;

        if (!in_array($status, ['maintenance', 'lost', 'archived'], true)) {
            $status = $newAvailable === $material->quantity_total ? 'available' : 'in_use';
        }

        $material->update([
            'quantity_available' => $newAvailable,
            'status' => $status,
        ]);
    }

    private function createMovementFromLoan(MaterialLoan $materialLoan, string $movementType, int $quantity): void
    {
        if ($quantity <= 0) {
            return;
        }

        $this->materialMovementService->createMaterialMovement([
            'material_id' => $materialLoan->material_id,
            'material_loan_id' => $materialLoan->id,
            'movement_type' => $movementType,
            'quantity' => $quantity,
            'movement_date' => now(),
            'source_location' => $movementType === 'loan' ? $materialLoan->material?->storage_location : null,
            'destination_location' => $movementType === 'return' ? $materialLoan->material?->storage_location : null,
            'notes' => $movementType === 'loan'
                ? 'Mouvement cree automatiquement a partir d un pret.'
                : 'Mouvement cree automatiquement a partir d un retour de pret.',
            'created_by' => $materialLoan->created_by,
        ]);
    }
}
