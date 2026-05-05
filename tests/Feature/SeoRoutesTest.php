<?php

namespace Tests\Feature;

use Tests\TestCase;

class SeoRoutesTest extends TestCase
{
    public function test_sitemap_route_returns_valid_xml_response(): void
    {
        $response = $this->get('/sitemap.xml');

        $response
            ->assertOk()
            ->assertHeader('Content-Type', 'application/xml')
            ->assertSee('<?xml version="1.0" encoding="UTF-8"?>', false)
            ->assertSee('<loc>', false);
    }

    public function test_webmanifest_route_returns_manifest_json(): void
    {
        $response = $this->get('/site.webmanifest');

        $response
            ->assertOk()
            ->assertHeader('Content-Type', 'application/manifest+json')
            ->assertJsonPath('name', 'AEUTNA')
            ->assertJsonPath('short_name', 'AEUTNA');
    }
}
