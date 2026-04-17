<?php

namespace App\Http\Controllers;

use App\Http\Requests\Members\StoreMemberRequest;
use App\Http\Requests\Members\UpdateMemberRequest;
use App\Models\Member;
use App\Services\ActivityLogService;
use App\Services\MemberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class MemberController extends Controller
{
    public function __construct(
        private MemberService $memberService,
        private ActivityLogService $activityLogService
    ) {}

    private function resolveEncryptedMemberId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant membre invalide.'],
            ]);
        }

        return $id;
    }

    private function uploadPhoto(StoreMemberRequest|UpdateMemberRequest $request, ?string $currentPhoto = null): ?string
    {
        if (!$request->hasFile('photo')) {
            return $currentPhoto;
        }

        if ($currentPhoto && str_starts_with($currentPhoto, 'uploads/members/')) {
            $currentPhotoPath = public_path($currentPhoto);

            if (File::exists($currentPhotoPath)) {
                File::delete($currentPhotoPath);
            }
        }

        $directory = public_path('uploads/members');

        if (!File::exists($directory)) {
            File::makeDirectory($directory, 0755, true);
        }

        $file = $request->file('photo');
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $file->move($directory, $filename);

        return 'uploads/members/' . $filename;
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $members = $this->memberService->getAllMembers(
                fields: ['*'],
                relations: ['user', 'application', 'axe', 'educationLevel', 'currentMemberFunction.function', 'currentMemberFunctions.function'],
                withTrashed: $request->boolean('with_trashed'),
                onlyTrashed: $request->boolean('only_trashed'),
                paginate: $request->integer('per_page')
            );

            return response()->json($members);
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'members_index_error',
                'Erreur lors de la consultation de la liste des membres.',
                $exception,
                $request->user(),
                Member::class,
                null,
                500
            );

            throw $exception;
        }
    }

    public function show(Request $request, string $encryptedId): JsonResponse
    {
        $id = null;

        try {
            $id = $this->resolveEncryptedMemberId($encryptedId);
            $member = $this->memberService->getByIdMember($id, ['*'], ['user', 'application', 'axe', 'educationLevel', 'memberFunctions.function', 'currentMemberFunction.function', 'currentMemberFunctions.function'], true);

            return response()->json([
                'member' => $member,
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'members_show_validation_failed',
                'Echec de validation lors de la consultation d un membre.',
                $request->user(),
                Member::class,
                null,
                422,
                [
                    'encrypted_id' => $encryptedId,
                    'errors' => $exception->errors(),
                ]
            );

            throw $exception;
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'members_show_error',
                'Erreur lors de la consultation d un membre.',
                $exception,
                $request->user(),
                Member::class,
                $id,
                500,
                [
                    'encrypted_id' => $encryptedId,
                ]
            );

            throw $exception;
        }
    }

    public function store(StoreMemberRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            $validated['photo'] = $this->uploadPhoto($request);
            $validated['member_number'] = filled($validated['member_number'] ?? null)
                ? $validated['member_number']
                : $this->memberService->getNextMemberNumber();
            $member = $this->memberService->createMember($validated);

            $this->activityLogService->logSuccess(
                $request,
                'members_store',
                'Creation membre reussie.',
                $request->user(),
                Member::class,
                $member->id,
                201,
                [
                    'member_number' => $member->member_number,
                    'email' => $member->email,
                    'status' => $member->status,
                ]
            );

            return response()->json([
                'message' => 'Membre cree avec succes.',
                'member' => $member->fresh(['user', 'application', 'axe', 'educationLevel', 'memberFunctions.function', 'currentMemberFunction.function', 'currentMemberFunctions.function']),
            ], 201);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'members_store_validation_failed',
                'Echec de validation lors de la creation membre.',
                $request->user(),
                Member::class,
                null,
                422,
                [
                    'member_number' => $request->input('member_number'),
                    'email' => $request->input('email'),
                    'errors' => $exception->errors(),
                ]
            );

            throw $exception;
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'members_store_error',
                'Erreur lors de la creation membre.',
                $exception,
                $request->user(),
                Member::class,
                null,
                500,
                [
                    'member_number' => $request->input('member_number'),
                    'email' => $request->input('email'),
                ]
            );

            throw $exception;
        }
    }

    public function update(UpdateMemberRequest $request, string $encryptedId): JsonResponse
    {
        $id = null;

        try {
            $id = $this->resolveEncryptedMemberId($encryptedId);
            $member = $this->memberService->getByIdMember($id, ['*'], [], true);
            $validated = $request->validated();
            $validated['photo'] = $this->uploadPhoto($request, $member->photo);

            $member = $this->memberService->updateMember($member, $validated);

            $this->activityLogService->logSuccess(
                $request,
                'members_update',
                'Mise a jour membre reussie.',
                $request->user(),
                Member::class,
                $member->id,
                200,
                [
                    'member_number' => $member->member_number,
                    'email' => $member->email,
                    'updated_fields' => array_keys($validated),
                ]
            );

            return response()->json([
                'message' => 'Membre mis a jour avec succes.',
                'member' => $member->fresh(['user', 'application', 'axe', 'educationLevel', 'memberFunctions.function', 'currentMemberFunction.function', 'currentMemberFunctions.function']),
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'members_update_validation_failed',
                'Echec de validation lors de la mise a jour membre.',
                $request->user(),
                Member::class,
                $id,
                422,
                [
                    'encrypted_id' => $encryptedId,
                    'errors' => $exception->errors(),
                ]
            );

            throw $exception;
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'members_update_error',
                'Erreur lors de la mise a jour membre.',
                $exception,
                $request->user(),
                Member::class,
                $id,
                500,
                [
                    'encrypted_id' => $encryptedId,
                ]
            );

            throw $exception;
        }
    }

    public function destroy(Request $request, string $encryptedId): JsonResponse
    {
        $id = null;

        try {
            $id = $this->resolveEncryptedMemberId($encryptedId);
            $member = $this->memberService->getByIdMember($id);

            $memberNumber = $member->member_number;
            $email = $member->email;

            $this->memberService->deleteMember($member);

            $this->activityLogService->logInfo(
                $request,
                'members_delete',
                'Suppression logique membre reussie.',
                $request->user(),
                Member::class,
                $id,
                200,
                [
                    'member_number' => $memberNumber,
                    'email' => $email,
                ]
            );

            return response()->json([
                'message' => 'Membre supprime avec succes.',
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'members_delete_validation_failed',
                'Echec de validation lors de la suppression membre.',
                $request->user(),
                Member::class,
                null,
                422,
                [
                    'encrypted_id' => $encryptedId,
                    'errors' => $exception->errors(),
                ]
            );

            throw $exception;
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'members_delete_error',
                'Erreur lors de la suppression membre.',
                $exception,
                $request->user(),
                Member::class,
                $id,
                500,
                [
                    'encrypted_id' => $encryptedId,
                ]
            );

            throw $exception;
        }
    }
}
