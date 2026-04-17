<?php

namespace App\Http\Controllers;

use App\Http\Requests\MembershipCards\StoreMembershipCardRequest;
use App\Http\Requests\MembershipCards\UpdateMembershipCardRequest;
use App\Services\MembershipCardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class MembershipCardController extends Controller
{
    public function __construct(private MembershipCardService $membershipCardService) {}

    private function resolveEncryptedMembershipCardId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant carte invalide.'],
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

        if ($request->filled('status')) {
            $keys[] = 'status';
            $values[] = $request->string('status')->value();
        }

        $cards = $this->membershipCardService->getAllMembershipCards(
            keys: !empty($keys) ? $keys : null,
            values: !empty($values) ? $values : null,
            fields: ['*'],
            relations: ['member'],
            paginate: $request->integer('per_page')
        );

        return response()->json($cards);
    }

    public function show(string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedMembershipCardId($encryptedId);
        $card = $this->membershipCardService->getByIdMembershipCard($id, ['*'], ['member']);

        return response()->json([
            'membership_card' => $card,
        ]);
    }

    public function store(StoreMembershipCardRequest $request): JsonResponse
    {
        $card = $this->membershipCardService->createMembershipCard($request->validated());

        return response()->json([
            'message' => 'Carte membre enregistree avec succes.',
            'membership_card' => $card->fresh(['member']),
        ], 201);
    }

    public function update(UpdateMembershipCardRequest $request, string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedMembershipCardId($encryptedId);
        $card = $this->membershipCardService->getByIdMembershipCard($id);
        $card = $this->membershipCardService->updateMembershipCard($card, $request->validated());

        return response()->json([
            'message' => 'Carte membre mise a jour avec succes.',
            'membership_card' => $card->fresh(['member']),
        ]);
    }

    public function destroy(string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedMembershipCardId($encryptedId);
        $card = $this->membershipCardService->getByIdMembershipCard($id);
        $this->membershipCardService->deleteMembershipCard($card);

        return response()->json([
            'message' => 'Carte membre supprimee avec succes.',
        ]);
    }
}
