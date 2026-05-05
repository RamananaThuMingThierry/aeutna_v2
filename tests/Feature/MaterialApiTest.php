<?php

namespace Tests\Feature;

use App\Models\Material;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MaterialApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_manage_materials(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $createResponse = $this->post('/api/materials', [
            'name' => 'Projecteur Epson',
            'reference' => 'MAT-001',
            'category' => 'audiovisuel',
            'description' => 'Projecteur principal pour les activites.',
            'quantity_total' => 5,
            'quantity_available' => 4,
            'condition_status' => 'good',
            'status' => 'available',
            'storage_location' => 'Salle A',
            'acquired_at' => '2026-04-28',
            'acquisition_cost' => 1250.50,
            'notes' => 'Verifier la lampe chaque trimestre.',
            'images' => [
                UploadedFile::fake()->image('projecteur-1.jpg'),
                UploadedFile::fake()->image('projecteur-2.jpg'),
            ],
        ]);

        $createResponse->assertCreated()
            ->assertJsonPath('material.name', 'Projecteur Epson')
            ->assertJsonPath('material.reference', 'MAT-001')
            ->assertJsonPath('material.created_by', $user->id)
            ->assertJsonCount(2, 'material.images');

        $materialId = decrypt_to_int_or_null($createResponse->json('material.encrypted_id'));

        $this->assertNotNull($materialId);
        $this->assertDatabaseHas('materials', [
            'id' => $materialId,
            'name' => 'Projecteur Epson',
            'reference' => 'MAT-001',
            'created_by' => $user->id,
        ]);
        $this->assertDatabaseCount('material_images', 2);

        $material = Material::findOrFail($materialId);

        $this->getJson('/api/materials')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Projecteur Epson']);

        $this->getJson("/api/materials/{$material->encrypted_id}")
            ->assertOk()
            ->assertJsonPath('material.name', 'Projecteur Epson')
            ->assertJsonCount(2, 'material.images');

        $imageIdToDelete = $material->images()->orderBy('id')->value('id');

        $updateResponse = $this->post("/api/materials/{$material->encrypted_id}", [
            '_method' => 'PUT',
            'quantity_total' => 6,
            'quantity_available' => 5,
            'status' => 'maintenance',
            'notes' => 'Passe en maintenance preventive.',
            'deleted_image_ids' => [$imageIdToDelete],
            'images' => [
                UploadedFile::fake()->image('projecteur-3.jpg'),
            ],
        ]);

        $updateResponse->assertOk()
            ->assertJsonPath('material.quantity_total', 6)
            ->assertJsonPath('material.quantity_available', 5)
            ->assertJsonPath('material.status', 'maintenance')
            ->assertJsonCount(2, 'material.images');

        $this->assertDatabaseHas('materials', [
            'id' => $materialId,
            'quantity_total' => 6,
            'quantity_available' => 5,
            'status' => 'maintenance',
        ]);
        $this->assertDatabaseMissing('material_images', ['id' => $imageIdToDelete]);
        $this->assertDatabaseCount('material_images', 2);

        $this->deleteJson("/api/materials/{$material->encrypted_id}")
            ->assertOk()
            ->assertJsonPath('message', 'Material supprime avec succes.');

        $this->assertDatabaseMissing('materials', ['id' => $materialId]);
        $this->assertDatabaseCount('material_images', 0);
    }

    public function test_material_validation_rejects_available_quantity_greater_than_total(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/materials', [
            'name' => 'Chaise pliante',
            'quantity_total' => 2,
            'quantity_available' => 3,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['quantity_available']);
    }
}

