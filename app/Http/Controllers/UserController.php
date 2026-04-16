<?php

namespace App\Http\Controllers;

use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function __construct(private UserService $userService) {}

    public function index(Request $request): JsonResponse
    {
        $users = $this->userService->getAllUsers(
            fields: ['*'],
            relations: ['roles'],
            withTrashed: $request->boolean('with_trashed'),
            onlyTrashed: $request->boolean('only_trashed'),
            paginate: $request->integer('per_page')
        );

        return response()->json($users);
    }

    public function show(int $id): JsonResponse
    {
        $user = $this->userService->getByIdUser($id, ['*'], ['roles']);

        return response()->json([
            'user' => $user,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'phone' => ['nullable', 'string', 'max:30'],
            'avatar' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
            'roles' => ['nullable', 'array'],
            'roles.*' => ['string'],
        ]);

        $user = $this->userService->createUser([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'phone' => $validated['phone'] ?? null,
            'avatar' => $validated['avatar'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        if (! empty($validated['roles'])) {
            $user = $this->userService->syncRolesToUser($user->id, $validated['roles']);
        } else {
            $user = $user->fresh(['roles']);
        }

        return response()->json([
            'message' => 'Utilisateur cree avec succes.',
            'user' => $user,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $this->userService->getByIdUser($id, ['*'], ['roles']);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['sometimes', 'required', 'confirmed', Password::min(8)],
            'phone' => ['nullable', 'string', 'max:30'],
            'avatar' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $user = $this->userService->updateUser($user, $validated)->fresh(['roles']);

        return response()->json([
            'message' => 'Utilisateur mis a jour avec succes.',
            'user' => $user,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $user = $this->userService->getByIdUser($id);

        $this->userService->deleteUser($user);

        return response()->json([
            'message' => 'Utilisateur supprime avec succes.',
        ]);
    }

    public function assignRole(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string'],
        ]);

        $user = $this->userService->assignRoleToUser($id, $validated['role']);

        return response()->json([
            'message' => 'Role attribue avec succes.',
            'user' => $user,
        ]);
    }

    public function removeRole(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string'],
        ]);

        $user = $this->userService->removeRoleFromUser($id, $validated['role']);

        return response()->json([
            'message' => 'Role retire avec succes.',
            'user' => $user,
        ]);
    }

    public function syncRoles(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'roles' => ['required', 'array'],
            'roles.*' => ['string'],
        ]);

        $user = $this->userService->syncRolesToUser($id, $validated['roles']);

        return response()->json([
            'message' => 'Roles synchronises avec succes.',
            'user' => $user,
        ]);
    }
}
