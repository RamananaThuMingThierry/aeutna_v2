<?php

namespace App\Http\Controllers;

use App\Http\Requests\MaterialMovements\StoreMaterialMovementRequest;
use App\Http\Requests\MaterialMovements\UpdateMaterialMovementRequest;
use App\Services\MaterialMovementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class MaterialMovementController extends Controller
{
    public function __construct(private MaterialMovementService $materialMovementService) {}

    private function resolveEncryptedMaterialMovementId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant mouvement invalide.'],
            ]);
        }

        return $id;
    }

    public function index(Request $request): JsonResponse
    {
        $keys = [];
        $values = [];

        if ($request->filled('material_id')) {
            $keys[] = 'material_id';
            $values[] = $request->integer('material_id');
        }

        if ($request->filled('material_loan_id')) {
            $keys[] = 'material_loan_id';
            $values[] = $request->integer('material_loan_id');
        }

        if ($request->filled('movement_type')) {
            $keys[] = 'movement_type';
            $values[] = $request->string('movement_type')->toString();
        }

        $movements = $this->materialMovementService->getAllMaterialMovements(
            keys: !empty($keys) ? $keys : null,
            values: !empty($values) ? $values : null,
            relations: ['material', 'materialLoan', 'creator'],
            paginate: $request->integer('per_page')
        );

        return response()->json($movements);
    }

    public function show(Request $request, string $encryptedId): JsonResponse
    {
        $movement = $this->materialMovementService->getByIdMaterialMovement(
            $this->resolveEncryptedMaterialMovementId($encryptedId),
            ['*'],
            ['material', 'materialLoan', 'creator']
        );

        return response()->json(['material_movement' => $movement]);
    }

    public function store(StoreMaterialMovementRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['created_by'] = $request->user()?->id;

        $movement = $this->materialMovementService->createMaterialMovement($validated);

        return response()->json([
            'message' => 'Mouvement cree avec succes.',
            'material_movement' => $movement->fresh(['material', 'materialLoan', 'creator']),
        ], 201);
    }

    public function update(UpdateMaterialMovementRequest $request, string $encryptedId): JsonResponse
    {
        $movement = $this->materialMovementService->getByIdMaterialMovement($this->resolveEncryptedMaterialMovementId($encryptedId));
        $movement = $this->materialMovementService->updateMaterialMovement($movement, $request->validated());

        return response()->json([
            'message' => 'Mouvement mis a jour avec succes.',
            'material_movement' => $movement->fresh(['material', 'materialLoan', 'creator']),
        ]);
    }

    public function destroy(Request $request, string $encryptedId): JsonResponse
    {
        $movement = $this->materialMovementService->getByIdMaterialMovement($this->resolveEncryptedMaterialMovementId($encryptedId));
        $this->materialMovementService->deleteMaterialMovement($movement);

        return response()->json([
            'message' => 'Mouvement supprime avec succes.',
        ]);
    }
}
