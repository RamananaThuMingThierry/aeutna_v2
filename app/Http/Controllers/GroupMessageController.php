<?php

namespace App\Http\Controllers;

use App\Http\Requests\GroupMessages\StoreGroupMessageRequest;
use App\Models\GroupMessage;
use App\Models\Member;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GroupMessageController extends Controller
{
    private function resolveEncryptedGroupMessageId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        abort_if(is_null($id), 422, 'Identifiant message invalide.');

        return $id;
    }

    public function index(Request $request): JsonResponse
    {
        $messages = GroupMessage::query()
            ->with(['sender:id,name,email,avatar'])
            ->withCount('recipients')
            ->latest('sent_at')
            ->latest()
            ->limit(30)
            ->get();

        return response()->json([
            'messages' => $messages,
        ]);
    }

    public function show(Request $request, string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedGroupMessageId($encryptedId);

        $message = GroupMessage::query()
            ->with(['sender:id,name,email,avatar', 'recipients.member:id,first_name,last_name,member_type,phone,alternative_phone'])
            ->withCount('recipients')
            ->findOrFail($id);

        return response()->json([
            'group_message' => $message,
        ]);
    }

    public function store(StoreGroupMessageRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $recipients = $this->resolveRecipients($validated['audience_type']);
        $phoneNumbers = collect($recipients)
            ->pluck('phone')
            ->filter()
            ->unique()
            ->values();

        if ($phoneNumbers->isEmpty()) {
            return response()->json([
                'message' => 'Aucun numero de telephone n est disponible pour ce filtre.',
            ], 422);
        }

        $groupMessage = DB::transaction(function () use ($request, $validated, $recipients) {
            $groupMessage = GroupMessage::query()->create([
                'sender_id' => $request->user()?->id,
                'title' => $validated['title'] ?: $this->defaultTitle($validated['audience_type']),
                'content' => $validated['content'],
                'target_type' => $this->targetTypeForDatabase($validated['audience_type']),
                'target_label' => $validated['audience_type'],
                'sent_at' => now(),
            ]);

            $groupMessage->recipients()->createMany(
                collect($recipients)->map(fn (array $recipient) => [
                    'member_id' => $recipient['id'],
                ])->all()
            );

            return $groupMessage->load('sender:id,name,email')->loadCount('recipients');
        });

        return response()->json([
            'message' => 'Message de groupe prepare avec succes.',
            'group_message' => $groupMessage,
            'phone_numbers' => $phoneNumbers->all(),
        ], 201);
    }

    public function destroy(Request $request, string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedGroupMessageId($encryptedId);

        $message = GroupMessage::query()->findOrFail($id);
        $message->delete();

        return response()->json([
            'message' => 'Message supprime avec succes.',
        ]);
    }

    private function resolveRecipients(string $audienceType): array
    {
        $query = Member::query()->select(['id', 'first_name', 'last_name', 'member_type', 'phone', 'alternative_phone']);

        if ($audienceType === 'member') {
            $query->where('member_type', 'member');
        } elseif ($audienceType === 'bureau') {
            $query->where('member_type', 'bureau');
        }

        return $query
            ->get()
            ->map(function (Member $member) {
                return [
                    'id' => $member->id,
                    'name' => trim(($member->first_name ?? '') . ' ' . ($member->last_name ?? '')),
                    'phone' => $this->normalizePhone($member->phone ?: $member->alternative_phone),
                ];
            })
            ->filter(fn (array $recipient) => filled($recipient['phone']))
            ->values()
            ->all();
    }

    private function normalizePhone(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        $normalized = preg_replace('/[^\d+]/', '', $value) ?: null;

        if (!$normalized) {
            return null;
        }

        if (str_starts_with($normalized, '00')) {
            return '+' . substr($normalized, 2);
        }

        return $normalized;
    }

    private function defaultTitle(string $audienceType): string
    {
        return match ($audienceType) {
            'bureau' => 'Message bureau',
            'member' => 'Message membres',
            default => 'Message a tous',
        };
    }

    private function targetTypeForDatabase(string $audienceType): string
    {
        return match ($audienceType) {
            'member' => 'official_members',
            'bureau' => 'custom',
            default => 'all_members',
        };
    }
}
