<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\ActivityImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ActivityApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_manage_activity_and_images(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $createResponse = $this->post('/api/activities', [
            'title' => 'Forum annuel',
            'description' => 'Premiere edition',
            'location' => 'Baghdad',
            'starts_at' => '2026-05-02 10:00',
            'ends_at' => '2026-05-02 18:00',
            'status' => 'published',
            'images' => [
                UploadedFile::fake()->image('cover.jpg'),
                UploadedFile::fake()->image('gallery.jpg'),
            ],
            'cover_image_id' => '-1',
        ]);

        $createResponse->assertCreated()
            ->assertJsonPath('activity.title', 'Forum annuel')
            ->assertJsonPath('activity.status', 'published');

        $activityId = decrypt_to_int_or_null($createResponse->json('activity.encrypted_id'));

        $this->assertNotNull($activityId);
        $this->assertDatabaseHas('activities', [
            'id' => $activityId,
            'title' => 'Forum annuel',
            'created_by' => $user->id,
        ]);

        $activity = Activity::with('images')->findOrFail($activityId);
        $this->assertCount(2, $activity->images);
        $this->assertSame(1, $activity->images->where('is_cover', true)->count());

        $existingImage = $activity->images->firstWhere('is_cover', false);
        $coverImage = $activity->images->firstWhere('is_cover', true);

        $updateResponse = $this->post("/api/activities/{$activity->encrypted_id}?_method=PUT", [
            'title' => 'Forum annuel 2026',
            'description' => 'Programme mis a jour',
            'location' => 'Baghdad Centre',
            'starts_at' => '2026-05-03 09:00',
            'ends_at' => '2026-05-03 17:30',
            'status' => 'completed',
            'deleted_image_ids' => [$existingImage->id],
            'images' => [
                UploadedFile::fake()->image('new-cover.jpg'),
            ],
            'cover_image_id' => '-1',
        ]);

        $updateResponse->assertOk()
            ->assertJsonPath('activity.title', 'Forum annuel 2026')
            ->assertJsonPath('activity.status', 'completed');

        $activity->refresh()->load('images');

        $this->assertDatabaseMissing('activity_images', ['id' => $existingImage->id]);
        $this->assertCount(2, $activity->images);
        $this->assertSame(1, $activity->images->where('is_cover', true)->count());
        $this->assertTrue($activity->images->contains(fn (ActivityImage $image) => $image->id !== $coverImage->id && $image->is_cover));

        $this->get("/api/activities/{$activity->encrypted_id}")
            ->assertOk()
            ->assertJsonPath('activity.title', 'Forum annuel 2026');

        $this->delete("/api/activities/{$activity->encrypted_id}")
            ->assertOk()
            ->assertJsonPath('message', 'Activite supprimee avec succes.');

        $this->assertDatabaseMissing('activities', ['id' => $activity->id]);
        $this->assertDatabaseCount('activity_images', 0);
    }
}
