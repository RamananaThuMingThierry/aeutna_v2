<?php

namespace App\Http\Controllers;

use App\Http\Requests\Donations\StoreDonationRequest;
use App\Http\Requests\Donations\UpdateDonationRequest;
use App\Services\DonationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class DonationController extends Controller
{
    public function __construct(private DonationService $donationService) {}

    private function resolveEncryptedDonationId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant donation invalide.'],
            ]);
        }

        return $id;
    }

    public function index(Request $request): JsonResponse
    {
        $keys = [];
        $values = [];

        if ($request->filled('member_id')) {
            $keys[] = 'member_id';
            $values[] = $request->integer('member_id');
        }

        if ($request->filled('donation_type')) {
            $keys[] = 'donation_type';
            $values[] = $request->string('donation_type')->toString();
        }

        $donations = $this->donationService->getAllDonations(
            keys: !empty($keys) ? $keys : null,
            values: !empty($values) ? $values : null,
            relations: ['member', 'creator'],
            paginate: $request->integer('per_page')
        );

        return response()->json($donations);
    }

    public function show(Request $request, string $encryptedId): JsonResponse
    {
        $donation = $this->donationService->getByIdDonation(
            $this->resolveEncryptedDonationId($encryptedId),
            ['*'],
            ['member', 'creator']
        );

        return response()->json(['donation' => $donation]);
    }

    public function store(StoreDonationRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['created_by'] = $request->user()?->id;

        $donation = $this->donationService->createDonation($validated);

        return response()->json([
            'message' => 'Donation creee avec succes.',
            'donation' => $donation->fresh(['member', 'creator']),
        ], 201);
    }

    public function update(UpdateDonationRequest $request, string $encryptedId): JsonResponse
    {
        $donation = $this->donationService->getByIdDonation($this->resolveEncryptedDonationId($encryptedId));
        $donation = $this->donationService->updateDonation($donation, $request->validated());

        return response()->json([
            'message' => 'Donation mise a jour avec succes.',
            'donation' => $donation->fresh(['member', 'creator']),
        ]);
    }

    public function destroy(Request $request, string $encryptedId): JsonResponse
    {
        $donation = $this->donationService->getByIdDonation($this->resolveEncryptedDonationId($encryptedId));
        $this->donationService->deleteDonation($donation);

        return response()->json([
            'message' => 'Donation supprimee avec succes.',
        ]);
    }
}
