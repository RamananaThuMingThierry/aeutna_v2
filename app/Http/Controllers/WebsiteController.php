<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Album;
use App\Models\AlbumImage;
use App\Models\Statute;
use App\Models\MemberFunction;
use App\Models\Slide;
use Illuminate\Http\JsonResponse;

class WebsiteController extends Controller
{
    public function homeData(): JsonResponse
    {
        $slides = Slide::query()
            ->where('is_active', true)
            ->orderBy('position')
            ->orderByDesc('id')
            ->get(['id', 'title', 'subtitle', 'image_url', 'position', 'is_active']);

        $activities = Activity::query()
            ->with(['images'])
            ->whereIn('status', ['published', 'completed'])
            ->orderByDesc('starts_at')
            ->orderByDesc('id')
            ->limit(6)
            ->get(['id', 'title', 'description', 'location', 'starts_at', 'ends_at', 'status']);

        $gallery = $activities
            ->flatMap(fn (Activity $activity) => $activity->images->map(function ($image) use ($activity) {
                return [
                    'id' => $image->id,
                    'image_path' => $image->image_path,
                    'caption' => $image->caption,
                    'is_cover' => $image->is_cover,
                    'activity_title' => $activity->title,
                ];
            }))
            ->sortByDesc(fn (array $image) => $image['is_cover'])
            ->take(12)
            ->values();

        $roleHistory = MemberFunction::query()
            ->with([
                'member:id,first_name,last_name,photo,joined_at',
                'function:id,name,code',
            ])
            ->whereHas('function', function ($query) {
                $query->whereIn('code', ['PRESIDENT', 'COMMISSAIRE_COMPTES', 'TRESORIER']);
            })
            ->orderBy('start_date')
            ->orderBy('id')
            ->get()
            ->groupBy(fn (MemberFunction $item) => $item->function?->code)
            ->map(function ($items, $code) {
                return [
                    'code' => $code,
                    'label' => match ($code) {
                        'PRESIDENT' => 'Presidents',
                        'COMMISSAIRE_COMPTES' => 'Commissaires aux comptes',
                        'TRESORIER' => 'Tresoriers',
                        default => $code,
                    },
                    'items' => $items->map(function (MemberFunction $item) {
                        return [
                            'id' => $item->id,
                            'start_date' => optional($item->start_date)->toDateString(),
                            'end_date' => optional($item->end_date)->toDateString(),
                            'is_current' => $item->is_current,
                            'notes' => $item->notes,
                            'member' => [
                                'id' => $item->member?->id,
                                'full_name' => trim(($item->member?->first_name ?? '') . ' ' . ($item->member?->last_name ?? '')),
                                'photo' => $item->member?->photo,
                            ],
                        ];
                    })->values(),
                ];
            })
            ->values();

        return response()->json([
            'slides' => $slides,
            'about' => [
                'title' => 'Association des Etudiants d\'Université de Tananarive Natifs d\'Antalaha',
                'summary' => 'AEUTNA rassemble, accompagne et valorise les membres autour de la solidarite, de l entraide et du developpement communautaire.',
            ],
            'contacts' => [
                'email' => 'ramananathumingthierry@gmail.com',
                'phone' => '+261 32 75 637 70',
                'whatsapp' => '+261 32 75 637 70',
                'facebook' => 'https://facebook.com/aeutna',
                'address' => 'Tanambao V, Antalaha, Madagascar',
            ],
            'activities' => $activities,
            'gallery' => $gallery,
            'role_history' => $roleHistory,
        ]);
    }

    public function galleryData(): JsonResponse
    {
        $albums = Album::query()
            ->where('status', 'active')
            ->with(['images' => function ($query) {
                $query->where('status', 'active')->orderBy('position')->orderBy('id');
            }])
            ->orderByDesc('id')
            ->get()
            ->map(function (Album $album) {
                return [
                    'id' => $album->id,
                    'encrypted_id' => $album->encrypted_id,
                    'title' => $album->title,
                    'slug' => $album->slug,
                    'description' => $album->description,
                    'status' => $album->status,
                    'images_count' => $album->images->count(),
                    'cover_image' => $album->images->first() ? [
                        'image_url' => '/' . ltrim($album->images->first()->image_url, '/'),
                        'name' => $album->images->first()->name,
                    ] : null,
                    'images' => $album->images->map(function (AlbumImage $image) {
                        return [
                            'id' => $image->id,
                            'encrypted_id' => $image->encrypted_id,
                            'image_url' => '/' . ltrim($image->image_url, '/'),
                            'name' => $image->name,
                            'description' => $image->description,
                            'position' => $image->position,
                        ];
                    })->values(),
                ];
            })
            ->values();

        return response()->json([
            'albums' => $albums,
        ]);
    }

    public function activitiesData(): JsonResponse
    {
        $activities = Activity::query()
            ->with(['images'])
            ->whereIn('status', ['published', 'completed'])
            ->orderByDesc('starts_at')
            ->orderByDesc('id')
            ->get(['id', 'title', 'description', 'location', 'starts_at', 'ends_at', 'status']);

        return response()->json([
            'activities' => $activities,
        ]);
    }

    public function aboutData(): JsonResponse
    {
        $statute = Statute::query()
            ->with([
                'document' => function ($query) {
                    $query->select([
                        'id',
                        'title',
                        'file_name',
                        'file_path',
                        'document_type',
                        'visibility',
                        'publication_status',
                    ]);
                },
                'titles' => function ($query) {
                    $query->orderBy('sort_order')->orderBy('id');
                },
                'titles.articles' => function ($query) {
                    $query->orderBy('sort_order')->orderBy('id');
                },
            ])
            ->where('visibility', 'public')
            ->where('publication_status', 'published')
            ->where('is_current', true)
            ->first();

        if (!$statute) {
            $statute = Statute::query()
                ->with([
                    'document:id,title,file_name,file_path,document_type,visibility,publication_status',
                    'titles' => fn ($query) => $query->orderBy('sort_order')->orderBy('id'),
                    'titles.articles' => fn ($query) => $query->orderBy('sort_order')->orderBy('id'),
                ])
                ->where('visibility', 'public')
                ->where('publication_status', 'published')
                ->orderByDesc('effective_at')
                ->orderByDesc('id')
                ->first();
        }

        return response()->json([
            'about' => [
                'title' => "Association des Etudiants d'Universite de Tananarive Natifs d'Antalaha",
                'summary' => "L'AEUTNA rassemble les membres autour de l'entraide, de la transmission et de la valorisation de la communaute.",
                'mission' => "Renforcer les liens, soutenir les parcours et encourager la participation associative.",
                'vision' => "Construire une communaute unie, active et fiere de son histoire.",
                'values' => "Solidarite, responsabilite, memoire institutionnelle, engagement communautaire et valorisation de chaque generation.",
            ],
            'statute' => $statute ? [
                'id' => $statute->id,
                'encrypted_id' => $statute->encrypted_id,
                'title' => $statute->title,
                'version' => $statute->version,
                'validated_at' => optional($statute->validated_at)->toDateString(),
                'effective_at' => optional($statute->effective_at)->toDateString(),
                'document' => $statute->document
                    && $statute->document->visibility === 'public'
                    && $statute->document->publication_status === 'published'
                    ? [
                        'title' => $statute->document->title,
                        'file_name' => $statute->document->file_name,
                        'file_url' => $statute->document->file_url,
                    ]
                    : null,
                'titles' => $statute->titles->map(function ($title) {
                    return [
                        'id' => $title->id,
                        'number' => $title->number,
                        'heading' => $title->heading,
                        'articles' => $title->articles->map(function ($article) {
                            return [
                                'id' => $article->id,
                                'article_number' => $article->article_number,
                                'title' => $article->title,
                                'content' => $article->content,
                            ];
                        })->values(),
                    ];
                })->values(),
            ] : null,
        ]);
    }
}
