<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactUsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_user_can_submit_contact_message(): void
    {
        $response = $this->postJson('/api/contact-us', [
            'name' => 'Jean Dupont',
            'email' => 'jean@example.com',
            'phone' => '+261 34 12 345 67',
            'subject' => 'Demande d information',
            'message' => 'Je souhaite obtenir plus d informations sur les activites.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('message', 'Votre message a été envoye avec succes.')
            ->assertJsonPath('contact.email', 'jean@example.com')
            ->assertJsonPath('contact.subject', 'Demande d information');

        $this->assertDatabaseHas('contact_us', [
            'name' => 'Jean Dupont',
            'email' => 'jean@example.com',
            'subject' => 'Demande d information',
        ]);
    }

    public function test_contact_message_requires_main_fields(): void
    {
        $response = $this->postJson('/api/contact-us', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'subject', 'message']);
    }
}
