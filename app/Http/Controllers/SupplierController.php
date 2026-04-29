<?php

namespace App\Http\Controllers;

use App\Http\Requests\Suppliers\StoreSupplierRequest;
use App\Http\Requests\Suppliers\UpdateSupplierRequest;
use App\Services\SupplierService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class SupplierController extends Controller
{
    public function __construct(private SupplierService $supplierService) {}

    private function resolveEncryptedSupplierId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant fournisseur invalide.'],
            ]);
        }

        return $id;
    }

    public function index(Request $request): JsonResponse
    {
        $keys = [];
        $values = [];

        if ($request->filled('is_active')) {
            $keys[] = 'is_active';
            $values[] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        }

        $suppliers = $this->supplierService->getAllSuppliers(
            keys: !empty($keys) ? $keys : null,
            values: !empty($values) ? $values : null,
            paginate: $request->integer('per_page')
        );

        return response()->json($suppliers);
    }

    public function show(Request $request, string $encryptedId): JsonResponse
    {
        $supplier = $this->supplierService->getByIdSupplier($this->resolveEncryptedSupplierId($encryptedId), ['*'], ['materialMaintenances']);

        return response()->json(['supplier' => $supplier]);
    }

    public function store(StoreSupplierRequest $request): JsonResponse
    {
        $supplier = $this->supplierService->createSupplier($request->validated());

        return response()->json([
            'message' => 'Fournisseur cree avec succes.',
            'supplier' => $supplier,
        ], 201);
    }

    public function update(UpdateSupplierRequest $request, string $encryptedId): JsonResponse
    {
        $supplier = $this->supplierService->getByIdSupplier($this->resolveEncryptedSupplierId($encryptedId));
        $supplier = $this->supplierService->updateSupplier($supplier, $request->validated());

        return response()->json([
            'message' => 'Fournisseur mis a jour avec succes.',
            'supplier' => $supplier,
        ]);
    }

    public function destroy(Request $request, string $encryptedId): JsonResponse
    {
        $supplier = $this->supplierService->getByIdSupplier($this->resolveEncryptedSupplierId($encryptedId));
        $this->supplierService->deleteSupplier($supplier);

        return response()->json([
            'message' => 'Fournisseur supprime avec succes.',
        ]);
    }
}
