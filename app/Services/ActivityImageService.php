<?php

namespace App\Services;

use App\Interfaces\ActivityImageInterface;
use App\Models\ActivityImage;

class ActivityImageService
{
    public function __construct(private ActivityImageInterface $activityImageRepository) {}

    public function getAllActivityImages(
        string|array|null $keys = null,
        mixed $values = null,
        array $fields = ['*'],
        array $relations = [],
        ?int $paginate = null,
        array $orderBy = ['sort_order' => 'asc', 'id' => 'asc']
    ) {
        return $this->activityImageRepository->getAll($keys, $values, $fields, $relations, $paginate, $orderBy);
    }

    public function getByIdActivityImage(int|string|null $id, array $fields = ['*'], array $relations = []): ?ActivityImage
    {
        return $this->activityImageRepository->getById($id, $fields, $relations);
    }

    public function createActivityImage(array $data): ?ActivityImage
    {
        return $this->activityImageRepository->create($data);
    }

    public function updateActivityImage(ActivityImage $activityImage, array $data): ?ActivityImage
    {
        return $this->activityImageRepository->update($activityImage, $data);
    }

    public function deleteActivityImage(ActivityImage $activityImage): void
    {
        $this->activityImageRepository->delete($activityImage);
    }

    public function clearCoverForActivity(int $activityId, ?int $exceptId = null): void
    {
        $this->activityImageRepository->clearCoverForActivity($activityId, $exceptId);
    }
}
