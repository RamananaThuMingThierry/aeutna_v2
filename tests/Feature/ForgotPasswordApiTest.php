<?php

namespace Tests\Feature;

use App\Mail\PasswordResetCodeMail;
use App\Models\PasswordResetCode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ForgotPasswordApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_request_verify_and_reset_password(): void
    {
        Mail::fake();

        $user = User::factory()->create([
            'email' => 'member@example.com',
            'password' => 'old-password',
        ]);

        $forgotResponse = $this->postJson('/api/auth/forgot-password', [
            'email' => $user->email,
        ]);

        $forgotResponse->assertOk()
            ->assertJsonPath('message', 'Si un compte existe avec cette adresse email, un code a ete envoye.');

        $resetCode = PasswordResetCode::query()->where('email', $user->email)->first();

        $this->assertNotNull($resetCode);
        Mail::assertSent(PasswordResetCodeMail::class);

        $resetCode->forceFill([
            'code' => Hash::make('123456'),
        ])->save();

        $verifyResponse = $this->postJson('/api/auth/forgot-password/verify-code', [
            'email' => $user->email,
            'code' => '123456',
        ]);

        $verifyResponse->assertOk()
            ->assertJsonStructure(['message', 'reset_token']);

        $plainToken = $verifyResponse->json('reset_token');

        $this->assertNotEmpty($plainToken);

        $this->postJson('/api/auth/reset-password', [
            'email' => $user->email,
            'token' => $plainToken,
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])->assertOk()
            ->assertJsonPath('message', 'Mot de passe reinitialise avec succes.');

        $this->assertTrue(Hash::check('new-password-123', $user->fresh()->password));
        $this->assertDatabaseMissing('password_reset_codes', ['email' => $user->email]);
    }

    public function test_verify_code_rejects_invalid_code(): void
    {
        Mail::fake();

        $user = User::factory()->create(['email' => 'member@example.com']);

        $this->postJson('/api/auth/forgot-password', [
            'email' => $user->email,
        ])->assertOk();

        PasswordResetCode::query()->where('email', $user->email)->update([
            'code' => Hash::make('123456'),
        ]);

        $this->postJson('/api/auth/forgot-password/verify-code', [
            'email' => $user->email,
            'code' => '000000',
        ])->assertStatus(422)
            ->assertJsonPath('message', 'Code de verification invalide ou expire.');
    }
}
