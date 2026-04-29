<?php

namespace Tests\Feature;

use App\Models\Material;
use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MaterialLoanApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_material_loan_updates_available_quantity_and_creates_movements(): void
    {
        $user = User::factory()->create();
        $member = Member::factory()->create();
        $material = Material::create([
            'name' => 'Micro HF',
            'quantity_total' => 4,
            'quantity_available' => 4,
            'condition_status' => 'good',
            'status' => 'available',
            'created_by' => $user->id,
        ]);

        Sanctum::actingAs($user);

        $createResponse = $this->postJson('/api/material-loans', [
            'material_id' => $material->id,
            'member_id' => $member->id,
            'quantity' => 2,
            'loaned_at' => '2026-04-29 10:00:00',
            'status' => 'ongoing',
        ]);

        $createResponse->assertCreated()
            ->assertJsonPath('material_loan.quantity', 2)
            ->assertJsonPath('material_loan.status', 'ongoing');

        $material->refresh();

        $this->assertSame(2, $material->quantity_available);
        $this->assertDatabaseHas('material_movements', [
            'material_id' => $material->id,
            'movement_type' => 'loan',
            'quantity' => 2,
        ]);

        $encryptedId = $createResponse->json('material_loan.encrypted_id');

        $this->postJson("/api/material-loans/{$encryptedId}/return", [
            'returned_at' => '2026-04-30 16:00:00',
        ])->assertOk()
            ->assertJsonPath('material_loan.status', 'returned');

        $material->refresh();

        $this->assertSame(4, $material->quantity_available);
        $this->assertDatabaseHas('material_movements', [
            'material_id' => $material->id,
            'movement_type' => 'return',
            'quantity' => 2,
        ]);
    }
}
