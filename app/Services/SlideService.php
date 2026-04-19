<?php

namespace App\Services;

use App\Interfaces\SlideInterface;
use App\Models\Slide;

class SlideService
{
    public function __construct(private SlideInterface $slideRepository) {}

    public function getAllSlides(
        string|array|null $keys = null,
        mixed $values = null,
        array $fields = ['*'],
        array $relations = [],
        ?int $paginate = null,
        array $orderBy = ['position' => 'asc', 'id' => 'desc']
    ) {
        return $this->slideRepository->getAll($keys, $values, $fields, $relations, $paginate, $orderBy);
    }

    public function getByIdSlide(int|string|null $id, array $fields = ['*'], array $relations = []): ?Slide
    {
        return $this->slideRepository->getById($id, $fields, $relations);
    }

    public function createSlide(array $data): ?Slide
    {
        $data['position'] = isset($data['position']) ? (int) $data['position'] : 0;
        $data['is_active'] = $data['is_active'] ?? true;

        return $this->slideRepository->create($data);
    }

    public function updateSlide(Slide $slide, array $data): ?Slide
    {
        if (isset($data['position'])) {
            $data['position'] = (int) $data['position'];
        }

        return $this->slideRepository->update($slide, $data);
    }

    public function deleteSlide(Slide $slide): void
    {
        $this->slideRepository->delete($slide);
    }
}
