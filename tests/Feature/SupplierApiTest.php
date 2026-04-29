<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SupplierApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_manage_suppliers(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $createResponse = $this->postJson('/api/suppliers', [
            'name' => 'Tech Distrib',
            'contact_name' => 'Jean Pierre',
            'email' => 'contact@tech-distrib.test',
            'phone' => '0102030405',
            'city' => 'Antananarivo',
            'country' => 'Madagascar',
            'is_active' => true,
        ]);

        $createResponse->assertCreated()
            ->assertJsonPath('supplier.name', 'Tech Distrib');

        $encryptedId = $createResponse->json('supplier.encrypted_id');

        $this->getJson('/api/suppliers')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Tech Distrib']);

        $this->putJson("/api/suppliers/{$encryptedId}", [
            'phone' => '0200000000',
            'is_active' => false,
        ])->assertOk()
            ->assertJsonPath('supplier.phone', '0200000000')
            ->assertJsonPath('supplier.is_active', false);

        $this->deleteJson("/api/suppliers/{$encryptedId}")
            ->assertOk()
            ->assertJsonPath('message', 'Fournisseur supprime avec succes.');
    }
}
