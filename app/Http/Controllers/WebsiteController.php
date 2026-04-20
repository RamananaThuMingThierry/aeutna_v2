<?php

namespace App\Http\Controllers;

use App\Models\Activity;
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
                'title' => 'Association des Etudiants et Universitaires de Tanambao V',
                'summary' => 'AEUTNA rassemble, accompagne et valorise les etudiants et universitaires autour de la solidarite, de l entraide et du developpement communautaire.',
            ],
            'contacts' => [
                'email' => 'contact@aeutna.local',
                'phone' => '+261 00 000 00',
                'whatsapp' => '+261 00 000 00',
                'facebook' => 'https://facebook.com/aeutna',
                'address' => 'Tanambao V, Antalaha, Madagascar',
            ],
            'activities' => $activities,
            'gallery' => $gallery,
            'role_history' => $roleHistory,
        ]);
    }
}
