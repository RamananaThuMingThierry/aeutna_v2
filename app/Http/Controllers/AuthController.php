<?php

namespace App\Http\Controllers;

use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function __construct(private UserService $userService) {}

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        $user = $this->userService->createUser([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'phone' => $validated['phone'] ?? null,
            'is_active' => true,
        ]);

        $user = $this->userService->assignRoleToUser($user->id, 'member');

        Auth::login($user);

        $request->session()->regenerate();

        return response()->json([
            'message' => 'Inscription reussie.',
            'user' => $user,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            return response()->json([
                'message' => 'Identifiants invalides.',
            ], 422);
        }

        $request->session()->regenerate();

        return response()->json([
            'message' => 'Connexion reussie.',
            'user' => $request->user()->load('roles'),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load('roles'),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Deconnexion reussie.',
        ]);
    }
}
