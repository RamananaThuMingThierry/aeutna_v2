<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\SyncUserRolesRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Requests\UserRoleRequest;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class UserController extends Controller
{
    public function __construct(
        private UserService $userService,
        private ActivityLogService $activityLogService
    ) {}

    private function resolveEncryptedUserId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant utilisateur invalide.'],
            ]);
        }

        return $id;
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $users = $this->userService->getAllUsers(
                fields: ['*'],
                relations: ['roles'],
                withTrashed: $request->boolean('with_trashed'),
                onlyTrashed: $request->boolean('only_trashed'),
                paginate: $request->integer('per_page')
            );

            $this->activityLogService->logInfo(
                $request,
                'users_index',
                'Consultation de la liste des utilisateurs.',
                $request->user(),
                User::class,
                null,
                200,
                [
                    'with_trashed' => $request->boolean('with_trashed'),
                    'only_trashed' => $request->boolean('only_trashed'),
                    'per_page' => $request->integer('per_page'),
                ]
            );

            return response()->json($users);
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'users_index_error',
                'Erreur lors de la consultation de la liste des utilisateurs.',
                $exception,
                $request->user(),
                User::class,
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
            $id = $this->resolveEncryptedUserId($encryptedId);

            $user = $this->userService->getByIdUser($id, ['*'], ['roles']);

            $this->activityLogService->logInfo(
                $request,
                'users_show',
                'Consultation d un utilisateur.',
                $request->user(),
                User::class,
                $user->id,
                200,
                [
                    'target_email' => $user->email,
                ]
            );

            return response()->json([
                'user' => $user,
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'users_show_validation_failed',
                'Echec de validation lors de la consultation d un utilisateur.',
                $request->user(),
                User::class,
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
                'users_show_error',
                'Erreur lors de la consultation d un utilisateur.',
                $exception,
                $request->user(),
                User::class,
                $id,
                500,
                [
                    'encrypted_id' => $encryptedId,
                ]
            );

            throw $exception;
        }
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();

            $user = $this->userService->createUser([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'phone' => $validated['phone'] ?? null,
                'avatar' => $validated['avatar'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            if (!empty($validated['roles'])) {
                $user = $this->userService->syncRolesToUser($user->id, $validated['roles']);
            } else {
                $user = $user->fresh(['roles']);
            }

            $this->activityLogService->logSuccess(
                $request,
                'users_store',
                'Creation utilisateur reussie.',
                $request->user(),
                User::class,
                $user->id,
                201,
                [
                    'target_email' => $user->email,
                    'roles' => $user->roles->pluck('code')->all(),
                ]
            );

            return response()->json([
                'message' => 'Utilisateur cree avec succes.',
                'user' => $user,
            ], 201);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'users_store_validation_failed',
                'Echec de validation lors de la creation utilisateur.',
                $request->user(),
                User::class,
                null,
                422,
                [
                    'email' => $request->input('email'),
                    'errors' => $exception->errors(),
                ]
            );

            throw $exception;
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'users_store_error',
                'Erreur lors de la creation utilisateur.',
                $exception,
                $request->user(),
                User::class,
                null,
                500,
                [
                    'email' => $request->input('email'),
                ]
            );

            throw $exception;
        }
    }

    public function update(UpdateUserRequest $request, string $encryptedId): JsonResponse
    {
        $id = null;

        try {
            $id = $this->resolveEncryptedUserId($encryptedId);
            $user = $this->userService->getByIdUser($id, ['*'], ['roles']);
            $validated = $request->validated();

            $user = $this->userService->updateUser($user, $validated)->fresh(['roles']);

            $this->activityLogService->logSuccess(
                $request,
                'users_update',
                'Mise a jour utilisateur reussie.',
                $request->user(),
                User::class,
                $user->id,
                200,
                [
                    'target_email' => $user->email,
                    'updated_fields' => array_keys($validated),
                ]
            );

            return response()->json([
                'message' => 'Utilisateur mis a jour avec succes.',
                'user' => $user,
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'users_update_validation_failed',
                'Echec de validation lors de la mise a jour utilisateur.',
                $request->user(),
                User::class,
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
                'users_update_error',
                'Erreur lors de la mise a jour utilisateur.',
                $exception,
                $request->user(),
                User::class,
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
            $id = $this->resolveEncryptedUserId($encryptedId);

            if ($request->user()?->id === $id) {
                throw ValidationException::withMessages([
                    'user' => ['Vous ne pouvez pas vous supprimer vous-meme.'],
                ]);
            }

            $user = $this->userService->getByIdUser($id);
            $targetEmail = $user->email;

            $this->userService->deleteUser($user);

            $this->activityLogService->logInfo(
                $request,
                'users_delete',
                'Suppression logique utilisateur reussie.',
                $request->user(),
                User::class,
                $id,
                200,
                [
                    'target_email' => $targetEmail,
                ]
            );

            return response()->json([
                'message' => 'Utilisateur supprime avec succes.',
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'users_delete_validation_failed',
                'Echec de validation lors de la suppression utilisateur.',
                $request->user(),
                User::class,
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
                'users_delete_error',
                'Erreur lors de la suppression utilisateur.',
                $exception,
                $request->user(),
                User::class,
                $id,
                500,
                [
                    'encrypted_id' => $encryptedId,
                ]
            );

            throw $exception;
        }
    }

    public function assignRole(UserRoleRequest $request, string $encryptedId): JsonResponse
    {
        $id = null;

        try {
            $id = $this->resolveEncryptedUserId($encryptedId);
            $validated = $request->validated();
            $user = $this->userService->assignRoleToUser($id, $validated['role']);

            $this->activityLogService->logSuccess(
                $request,
                'users_assign_role',
                'Attribution de role reussie.',
                $request->user(),
                User::class,
                $user->id,
                200,
                [
                    'role' => $validated['role'],
                    'target_email' => $user->email,
                ]
            );

            return response()->json([
                'message' => 'Role attribue avec succes.',
                'user' => $user,
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'users_assign_role_validation_failed',
                'Echec de validation lors de l attribution de role.',
                $request->user(),
                User::class,
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
                'users_assign_role_error',
                'Erreur lors de l attribution de role.',
                $exception,
                $request->user(),
                User::class,
                $id,
                500,
                [
                    'encrypted_id' => $encryptedId,
                ]
            );

            throw $exception;
        }
    }

    public function removeRole(UserRoleRequest $request, string $encryptedId): JsonResponse
    {
        $id = null;

        try {
            $id = $this->resolveEncryptedUserId($encryptedId);
            $validated = $request->validated();
            $user = $this->userService->removeRoleFromUser($id, $validated['role']);

            $this->activityLogService->logInfo(
                $request,
                'users_remove_role',
                'Retrait de role reussi.',
                $request->user(),
                User::class,
                $user->id,
                200,
                [
                    'role' => $validated['role'],
                    'target_email' => $user->email,
                ]
            );

            return response()->json([
                'message' => 'Role retire avec succes.',
                'user' => $user,
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'users_remove_role_validation_failed',
                'Echec de validation lors du retrait de role.',
                $request->user(),
                User::class,
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
                'users_remove_role_error',
                'Erreur lors du retrait de role.',
                $exception,
                $request->user(),
                User::class,
                $id,
                500,
                [
                    'encrypted_id' => $encryptedId,
                ]
            );

            throw $exception;
        }
    }

    public function syncRoles(SyncUserRolesRequest $request, string $encryptedId): JsonResponse
    {
        $id = null;

        try {
            $id = $this->resolveEncryptedUserId($encryptedId);
            $validated = $request->validated();
            $user = $this->userService->syncRolesToUser($id, $validated['roles']);

            $this->activityLogService->logSuccess(
                $request,
                'users_sync_roles',
                'Synchronisation des roles reussie.',
                $request->user(),
                User::class,
                $user->id,
                200,
                [
                    'roles' => $validated['roles'],
                    'target_email' => $user->email,
                ]
            );

            return response()->json([
                'message' => 'Roles synchronises avec succes.',
                'user' => $user,
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'users_sync_roles_validation_failed',
                'Echec de validation lors de la synchronisation des roles.',
                $request->user(),
                User::class,
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
                'users_sync_roles_error',
                'Erreur lors de la synchronisation des roles.',
                $exception,
                $request->user(),
                User::class,
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
