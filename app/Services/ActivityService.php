<?php

namespace App\Services;

use App\Interfaces\ActivityInterface;
use App\Models\Activity;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class ActivityService
{
    public function __construct(
        private ActivityInterface $activityRepository,
        private ActivityImageService $activityImageService
    ) {}

    public function getAllActivities(
        string|array|null $keys = null,
        mixed $values = null,
        array $fields = ['*'],
        array $relations = [],
        ?int $paginate = null,
        array $orderBy = ['starts_at' => 'desc', 'id' => 'desc']
    ) {
        return $this->activityRepository->getAll($keys, $values, $fields, $relations, $paginate, $orderBy);
    }

    public function getByIdActivity(int|string|null $id, array $fields = ['*'], array $relations = []): ?Activity
    {
        return $this->activityRepository->getById($id, $fields, $relations);
    }

    public function createActivity(array $data, array $uploadedImages = []): Activity
    {
        return DB::transaction(function () use ($data, $uploadedImages) {
            $activity = $this->activityRepository->create($this->normalizePayload($data));
            $this->syncImages($activity, $uploadedImages, [], $data['cover_image_id'] ?? null);

            return $activity->fresh(['creator', 'images']);
        });
    }

    public function updateActivity(Activity $activity, array $data, array $uploadedImages = []): Activity
    {
        return DB::transaction(function () use ($activity, $data, $uploadedImages) {
            $activity = $this->activityRepository->update($activity, $this->normalizePayload($data));

            $deletedIds = collect($data['deleted_image_ids'] ?? [])
                ->filter(fn ($id) => is_numeric($id))
                ->map(fn ($id) => (int) $id)
                ->values()
                ->all();

            $this->syncImages($activity, $uploadedImages, $deletedIds, $data['cover_image_id'] ?? null);

            return $activity->fresh(['creator', 'images']);
        });
    }

    public function deleteActivity(Activity $activity): void
    {
        DB::transaction(function () use ($activity) {
            $activity->loadMissing('images');

            foreach ($activity->images as $image) {
                $this->deleteImageFile($image->image_path);
            }

            $this->activityRepository->delete($activity);
        });
    }

    private function normalizePayload(array $data): array
    {
        $payload = [
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'location' => $data['location'] ?? null,
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
            'status' => $data['status'] ?? 'draft',
        ];

        if (array_key_exists('created_by', $data)) {
            $payload['created_by'] = $data['created_by'];
        }

        return $payload;
    }

    private function syncImages(Activity $activity, array $uploadedImages, array $deletedIds, mixed $coverImageId): void
    {
        $activity->loadMissing('images');

        $existingImages = $activity->images->keyBy('id');
        $maxSortOrder = (int) ($activity->images->max('sort_order') ?? 0);

        foreach ($deletedIds as $id) {
            $image = $existingImages->get($id);

            if (!$image) {
                continue;
            }

            $this->deleteImageFile($image->image_path);
            $this->activityImageService->deleteActivityImage($image);
        }

        $newCoverMarker = is_numeric($coverImageId) ? (int) $coverImageId : null;

        foreach (array_values($uploadedImages) as $index => $file) {
            if (!$file instanceof UploadedFile) {
                continue;
            }

            $image = $this->activityImageService->createActivityImage([
                'activity_id' => $activity->id,
                'image_path' => $this->storeImageFile($file),
                'caption' => null,
                'sort_order' => $maxSortOrder + $index + 1,
                'is_cover' => false,
            ]);

            if ($newCoverMarker === -($index + 1) && $image) {
                $this->activityImageService->clearCoverForActivity($activity->id, $image->id);
                $this->activityImageService->updateActivityImage($image, ['is_cover' => true]);
            }
        }

        if ($newCoverMarker !== null && $newCoverMarker > 0) {
            $coverImage = $this->activityImageService->getByIdActivityImage($newCoverMarker);

            if ($coverImage && $coverImage->activity_id === $activity->id) {
                $this->activityImageService->clearCoverForActivity($activity->id, $coverImage->id);
                $this->activityImageService->updateActivityImage($coverImage, ['is_cover' => true]);
            }
        }

        $activity->unsetRelation('images');
        $images = $activity->images()->orderBy('sort_order')->orderBy('id')->get();

        if ($images->isNotEmpty() && $images->where('is_cover', true)->isEmpty()) {
            $firstImage = $images->first();
            $this->activityImageService->clearCoverForActivity($activity->id, $firstImage->id);
            $this->activityImageService->updateActivityImage($firstImage, ['is_cover' => true]);
        }
    }

    private function storeImageFile(UploadedFile $file): string
    {
        $directory = public_path('uploads/activities');

        if (!File::exists($directory)) {
            File::makeDirectory($directory, 0755, true);
        }

        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $file->move($directory, $filename);

        return 'uploads/activities/' . $filename;
    }

    private function deleteImageFile(?string $path): void
    {
        if (!$path || !str_starts_with($path, 'uploads/activities/')) {
            return;
        }

        $absolutePath = public_path($path);

        if (File::exists($absolutePath)) {
            File::delete($absolutePath);
        }
    }
}
