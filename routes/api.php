<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AnnualFeeController;
use App\Http\Controllers\AxeController;
use App\Http\Controllers\EducationLevelController;
use App\Http\Controllers\FeePaymentController;
use App\Http\Controllers\FunctionController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\MembershipCardController;
use App\Http\Controllers\SlideController;
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
    Route::get('/activity-logs', [ActivityLogController::class, 'index'])->name('activity_logs.index');
    Route::get('/activity-logs/{id}', [ActivityLogController::class, 'show'])->name('activity_logs.show');
    Route::get('/activities', [ActivityController::class, 'index'])->name('activities.index');
    Route::post('/activities', [ActivityController::class, 'store'])->name('activities.store');
    Route::get('/activities/{encryptedId}', [ActivityController::class, 'show'])->name('activities.show');
    Route::put('/activities/{encryptedId}', [ActivityController::class, 'update'])->name('activities.update');
    Route::delete('/activities/{encryptedId}', [ActivityController::class, 'destroy'])->name('activities.destroy');
    Route::get('/annual-fees', [AnnualFeeController::class, 'index'])->name('annual_fees.index');
    Route::post('/annual-fees', [AnnualFeeController::class, 'store'])->name('annual_fees.store');
    Route::get('/annual-fees/{encryptedId}', [AnnualFeeController::class, 'show'])->name('annual_fees.show');
    Route::put('/annual-fees/{encryptedId}', [AnnualFeeController::class, 'update'])->name('annual_fees.update');
    Route::delete('/annual-fees/{encryptedId}', [AnnualFeeController::class, 'destroy'])->name('annual_fees.destroy');
    Route::get('/axes', [AxeController::class, 'index'])->name('axes.index');
    Route::post('/axes', [AxeController::class, 'store'])->name('axes.store');
    Route::get('/axes/{encryptedId}', [AxeController::class, 'show'])->name('axes.show');
    Route::put('/axes/{encryptedId}', [AxeController::class, 'update'])->name('axes.update');
    Route::delete('/axes/{encryptedId}', [AxeController::class, 'destroy'])->name('axes.destroy');
    Route::get('/education-levels', [EducationLevelController::class, 'index'])->name('education_levels.index');
    Route::post('/education-levels', [EducationLevelController::class, 'store'])->name('education_levels.store');
    Route::get('/education-levels/{encryptedId}', [EducationLevelController::class, 'show'])->name('education_levels.show');
    Route::put('/education-levels/{encryptedId}', [EducationLevelController::class, 'update'])->name('education_levels.update');
    Route::delete('/education-levels/{encryptedId}', [EducationLevelController::class, 'destroy'])->name('education_levels.destroy');
    Route::get('/functions', [FunctionController::class, 'index'])->name('functions.index');
    Route::post('/functions', [FunctionController::class, 'store'])->name('functions.store');
    Route::get('/functions/{encryptedId}', [FunctionController::class, 'show'])->name('functions.show');
    Route::put('/functions/{encryptedId}', [FunctionController::class, 'update'])->name('functions.update');
    Route::delete('/functions/{encryptedId}', [FunctionController::class, 'destroy'])->name('functions.destroy');
    Route::get('/members', [MemberController::class, 'index'])->name('members.index');
    Route::post('/members', [MemberController::class, 'store'])->name('members.store');
    Route::get('/members/{encryptedId}', [MemberController::class, 'show'])->name('members.show');
    Route::put('/members/{encryptedId}', [MemberController::class, 'update'])->name('members.update');
    Route::delete('/members/{encryptedId}', [MemberController::class, 'destroy'])->name('members.destroy');
    Route::get('/membership-cards', [MembershipCardController::class, 'index'])->name('membership_cards.index');
    Route::post('/membership-cards', [MembershipCardController::class, 'store'])->name('membership_cards.store');
    Route::get('/membership-cards/{encryptedId}', [MembershipCardController::class, 'show'])->name('membership_cards.show');
    Route::put('/membership-cards/{encryptedId}', [MembershipCardController::class, 'update'])->name('membership_cards.update');
    Route::delete('/membership-cards/{encryptedId}', [MembershipCardController::class, 'destroy'])->name('membership_cards.destroy');
    Route::get('/slides', [SlideController::class, 'index'])->name('slides.index');
    Route::post('/slides', [SlideController::class, 'store'])->name('slides.store');
    Route::get('/slides/{encryptedId}', [SlideController::class, 'show'])->name('slides.show');
    Route::put('/slides/{encryptedId}', [SlideController::class, 'update'])->name('slides.update');
    Route::delete('/slides/{encryptedId}', [SlideController::class, 'destroy'])->name('slides.destroy');
    Route::get('/fee-payments', [FeePaymentController::class, 'index'])->name('fee_payments.index');
    Route::post('/fee-payments', [FeePaymentController::class, 'store'])->name('fee_payments.store');
    Route::get('/fee-payments/{encryptedId}', [FeePaymentController::class, 'show'])->name('fee_payments.show');
    Route::put('/fee-payments/{encryptedId}', [FeePaymentController::class, 'update'])->name('fee_payments.update');
    Route::post('/fee-payments/{encryptedId}/validate', [FeePaymentController::class, 'validatePayment'])->name('fee_payments.validate');
    Route::post('/fee-payments/{encryptedId}/cancel', [FeePaymentController::class, 'cancel'])->name('fee_payments.cancel');
    Route::delete('/fee-payments/{encryptedId}', [FeePaymentController::class, 'destroy'])->name('fee_payments.destroy');
});
