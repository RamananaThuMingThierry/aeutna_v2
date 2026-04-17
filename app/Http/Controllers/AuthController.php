<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Users\UpdateProfileRequest;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class AuthController extends Controller
{
    public function __construct(
        private UserService $userService,
        private ActivityLogService $activityLogService
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();

            $user = $this->userService->createUser([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'phone' => $validated['phone'] ?? null,
                'is_active' => true,
            ]);

            $user = $this->userService->assignRoleToUser($user->id, 'member');
            $user->load('roles');

            $token = $user->createToken('auth_token')->plainTextToken;

            $this->activityLogService->logSuccess(
                $request,
                'register',
                'Inscription utilisateur reussie.',
                $user,
                User::class,
                $user->id,
                201,
                [
                    'email' => $user->email,
                    'roles' => $user->roles->pluck('code')->all(),
                ]
            );

            return response()->json([
                'message' => 'Inscription reussie.',
                'user' => $user,
                'roles' => $user->roles->pluck('code')->all(),
                'token' => $token,
                'token_type' => 'Bearer',
            ], 201);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'register_validation_failed',
                'Echec de validation lors de l inscription.',
                null,
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
                'register_error',
                'Erreur lors de l inscription utilisateur.',
                $exception,
                null,
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

    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $credentials = $request->validated();

            $user = User::query()
                ->where('email', $credentials['email'])
                ->first();

            if ($user === null || ! Hash::check($credentials['password'], $user->password)) {
                $this->activityLogService->logWarning(
                    $request,
                    'login_failed',
                    'Echec de connexion.',
                    $user,
                    User::class,
                    $user?->id,
                    422,
                    [
                        'email' => $credentials['email'],
                    ]
                );

                return response()->json([
                    'message' => 'Identifiants invalides.',
                ], 422);
            }

            $token = $user->createToken('auth_token')->plainTextToken;
            $user->load('roles');

            $this->activityLogService->logSuccess(
                $request,
                'login',
                'Connexion utilisateur reussie.',
                $user,
                User::class,
                $user->id,
                200,
                [
                    'email' => $user->email,
                    'roles' => $user->roles->pluck('code')->all(),
                    'token_name' => 'auth_token',
                ]
            );

            return response()->json([
                'message' => 'Connexion reussie.',
                'user' => $user,
                'roles' => $user->roles->pluck('code')->all(),
                'token' => $token
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'login_validation_failed',
                'Echec de validation lors de la connexion.',
                null,
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
                'login_error',
                'Erreur lors de la connexion utilisateur.',
                $exception,
                null,
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

    public function me(Request $request): JsonResponse
    {
        try {
            $user = $request->user()->load('roles');

            $this->activityLogService->logInfo(
                $request,
                'me',
                'Consultation du profil authentifie.',
                $user,
                User::class,
                $user->id,
                200,
                [
                    'roles' => $user->roles->pluck('code')->all(),
                ]
            );

            return response()->json([
                'user' => $user,
                'roles' => $user->roles->pluck('code')->all(),
            ]);
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'me_error',
                'Erreur lors de la consultation du profil authentifie.',
                $exception,
                $request->user(),
                User::class,
                $request->user()?->id,
                500
            );

            throw $exception;
        }
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        try {
            $user = $request->user();
            $validated = $request->validated();

            if ($request->hasFile('avatar')) {
                if (!empty($user->avatar) && str_starts_with($user->avatar, 'uploads/avatars/')) {
                    $oldAvatarPath = public_path($user->avatar);

                    if (File::exists($oldAvatarPath)) {
                        File::delete($oldAvatarPath);
                    }
                }

                $avatarDirectory = public_path('uploads/avatars');

                if (!File::isDirectory($avatarDirectory)) {
                    File::makeDirectory($avatarDirectory, 0755, true);
                }

                $avatarFile = $request->file('avatar');
                $avatarName = Str::uuid()->toString().'.'.$avatarFile->getClientOriginalExtension();
                $avatarFile->move($avatarDirectory, $avatarName);

                $validated['avatar'] = 'uploads/avatars/'.$avatarName;
            }

            if (empty($validated['password'])) {
                unset($validated['password']);
                unset($validated['password_confirmation']);
            }

            $user = $this->userService->updateUser($user, $validated)->fresh(['roles']);

            $this->activityLogService->logSuccess(
                $request,
                'profile_update',
                'Mise a jour du profil utilisateur reussie.',
                $user,
                User::class,
                $user->id,
                200,
                [
                    'updated_fields' => array_keys($validated),
                    'roles' => $user->roles->pluck('code')->all(),
                ]
            );

            return response()->json([
                'message' => 'Profil mis a jour avec succes.',
                'user' => $user,
                'roles' => $user->roles->pluck('code')->all(),
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'profile_update_validation_failed',
                'Echec de validation lors de la mise a jour du profil utilisateur.',
                $request->user(),
                User::class,
                $request->user()?->id,
                422,
                [
                    'errors' => $exception->errors(),
                ]
            );

            throw $exception;
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'profile_update_error',
                'Erreur lors de la mise a jour du profil utilisateur.',
                $exception,
                $request->user(),
                User::class,
                $request->user()?->id,
                500
            );

            throw $exception;
        }
    }

    public function logout(Request $request): JsonResponse
    {
        try {
            $user = $request->user()->load('roles');
            $currentToken = $user->currentAccessToken();

            $this->activityLogService->logInfo(
                $request,
                'logout',
                'Deconnexion utilisateur reussie.',
                $user,
                User::class,
                $user->id,
                200,
                [
                    'roles' => $user->roles->pluck('code')->all(),
                    'token_id' => $currentToken?->id,
                    'token_name' => $currentToken?->name,
                ]
            );

            $currentToken?->delete();

            return response()->json([
                'message' => 'Deconnexion reussie.',
            ]);
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'logout_error',
                'Erreur lors de la deconnexion utilisateur.',
                $exception,
                $request->user(),
                User::class,
                $request->user()?->id,
                500
            );

            throw $exception;
        }
    }
}
