<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->name('auth.register');
    Route::post('/login', [AuthController::class, 'login'])->name('auth.login');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me'])->name('auth.me');
        Route::put('/me', [AuthController::class, 'updateProfile'])->name('auth.me.update');
        Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');
    });

    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::get('/users/{encryptedId}', [UserController::class, 'show'])->name('users.show');
    Route::put('/users/{encryptedId}', [UserController::class, 'update'])->name('users.update');
    Route::delete('/users/{encryptedId}', [UserController::class, 'destroy'])->name('users.destroy');
    Route::post('/users/{encryptedId}/roles/assign', [UserController::class, 'assignRole'])->name('users.roles.assign');
    Route::post('/users/{encryptedId}/roles/remove', [UserController::class, 'removeRole'])->name('users.roles.remove');
    Route::put('/users/{encryptedId}/roles/sync', [UserController::class, 'syncRoles'])->name('users.roles.sync');
});
