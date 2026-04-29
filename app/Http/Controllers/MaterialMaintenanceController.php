<?php

namespace App\Http\Controllers;

use App\Http\Requests\MaterialMaintenances\StoreMaterialMaintenanceRequest;
use App\Http\Requests\MaterialMaintenances\UpdateMaterialMaintenanceRequest;
use App\Services\MaterialMaintenanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class MaterialMaintenanceController extends Controller
{
    public function __construct(private MaterialMaintenanceService $materialMaintenanceService) {}

    private function resolveEncryptedMaterialMaintenanceId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant maintenance invalide.'],
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

        if ($request->filled('supplier_id')) {
            $keys[] = 'supplier_id';
            $values[] = $request->integer('supplier_id');
        }

        if ($request->filled('status')) {
            $keys[] = 'status';
            $values[] = $request->string('status')->toString();
        }

        $maintenances = $this->materialMaintenanceService->getAllMaterialMaintenances(
            keys: !empty($keys) ? $keys : null,
            values: !empty($values) ? $values : null,
            relations: ['material', 'supplier', 'creator'],
            paginate: $request->integer('per_page')
        );

        return response()->json($maintenances);
    }

    public function show(Request $request, string $encryptedId): JsonResponse
    {
        $maintenance = $this->materialMaintenanceService->getByIdMaterialMaintenance(
            $this->resolveEncryptedMaterialMaintenanceId($encryptedId),
            ['*'],
            ['material', 'supplier', 'creator']
        );

        return response()->json(['material_maintenance' => $maintenance]);
    }

    public function store(StoreMaterialMaintenanceRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['created_by'] = $request->user()?->id;

        $maintenance = $this->materialMaintenanceService->createMaterialMaintenance($validated);

        return response()->json([
            'message' => 'Maintenance creee avec succes.',
            'material_maintenance' => $maintenance->fresh(['material', 'supplier', 'creator']),
        ], 201);
    }

    public function update(UpdateMaterialMaintenanceRequest $request, string $encryptedId): JsonResponse
    {
        $maintenance = $this->materialMaintenanceService->getByIdMaterialMaintenance($this->resolveEncryptedMaterialMaintenanceId($encryptedId));
        $maintenance = $this->materialMaintenanceService->updateMaterialMaintenance($maintenance, $request->validated());

        return response()->json([
            'message' => 'Maintenance mise a jour avec succes.',
            'material_maintenance' => $maintenance->fresh(['material', 'supplier', 'creator']),
        ]);
    }

    public function destroy(Request $request, string $encryptedId): JsonResponse
    {
        $maintenance = $this->materialMaintenanceService->getByIdMaterialMaintenance($this->resolveEncryptedMaterialMaintenanceId($encryptedId));
        $this->materialMaintenanceService->deleteMaterialMaintenance($maintenance);

        return response()->json([
            'message' => 'Maintenance supprimee avec succes.',
        ]);
    }
}
