<?php

use App\Models\Activity;
use App\Models\Album;
use App\Models\Slide;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Route;

Route::get('/sitemap.xml', function () {
    $baseUrl = rtrim(config('app.url') ?: url('/'), '/');
    $safeMax = static function (string $table, callable $resolver) {
        return Schema::hasTable($table) ? $resolver() : null;
    };
    $activitiesLastmod = $safeMax('activities', static fn () => Activity::query()->max('updated_at'));
    $albumsLastmod = $safeMax('albums', static fn () => Album::query()->max('updated_at'));
    $slidesLastmod = $safeMax('slides', static fn () => Slide::query()->max('updated_at'));
    $defaultLastmod = now()->toDateString();
    $normalizeLastmod = static fn ($value) => $value ? Carbon::parse($value)->toDateString() : null;

    $pages = [
        [
            'loc' => $baseUrl . '/',
            'priority' => '1.0',
            'changefreq' => 'weekly',
            'lastmod' => $normalizeLastmod(collect([$activitiesLastmod, $albumsLastmod, $slidesLastmod])->filter()->max()) ?? $defaultLastmod,
        ],
        ['loc' => $baseUrl . '/about', 'priority' => '0.8', 'changefreq' => 'monthly', 'lastmod' => $defaultLastmod],
        ['loc' => $baseUrl . '/activities', 'priority' => '0.9', 'changefreq' => 'weekly', 'lastmod' => $normalizeLastmod($activitiesLastmod) ?? $defaultLastmod],
        ['loc' => $baseUrl . '/gallery', 'priority' => '0.8', 'changefreq' => 'weekly', 'lastmod' => $normalizeLastmod($albumsLastmod) ?? $defaultLastmod],
        ['loc' => $baseUrl . '/bureau', 'priority' => '0.7', 'changefreq' => 'monthly', 'lastmod' => $defaultLastmod],
        ['loc' => $baseUrl . '/contacts', 'priority' => '0.7', 'changefreq' => 'monthly', 'lastmod' => $defaultLastmod],
        ['loc' => $baseUrl . '/devenir-membre', 'priority' => '0.7', 'changefreq' => 'monthly', 'lastmod' => $defaultLastmod],
    ];

    $xml = view('sitemap', [
        'pages' => $pages,
    ])->render();

    return response($xml, 200)->header('Content-Type', 'application/xml');
});

Route::get('/site.webmanifest', function () {
    return response()->json([
        'name' => 'AEUTNA',
        'short_name' => 'AEUTNA',
        'description' => 'Plateforme publique et membre de l association AEUTNA.',
        'start_url' => '/',
        'display' => 'standalone',
        'background_color' => '#f7f4ec',
        'theme_color' => '#115e59',
        'lang' => 'fr',
        'icons' => [
            [
                'src' => asset('favicon.ico'),
                'sizes' => '48x48',
                'type' => 'image/x-icon',
            ],
            [
                'src' => asset('images/logo_aeutna.jpg'),
                'sizes' => '512x512',
                'type' => 'image/jpeg',
            ],
        ],
    ])->header('Content-Type', 'application/manifest+json');
});

Route::view('/{any}', 'app')->where('any', '.*');
