<?php

namespace App\Services;

use App\Interfaces\EducationLevelInterface;
use App\Models\EducationLevel;

class EducationLevelService
{
    public function __construct(private EducationLevelInterface $educationLevelRepository) {}

    public function getAllEducationLevels(
        string|array|null $keys = null,
        mixed $values = null,
        array $fields = ['*'],
        array $relations = [],
        ?int $paginate = null,
        array $orderBy = ['id' => 'desc']
    ) {
        return $this->educationLevelRepository->getAll(
            $keys,
            $values,
            $fields,
            $relations,
            $paginate,
            $orderBy
        );
    }

    public function getByIdEducationLevel(
        int|string|null $id,
        array $fields = ['*'],
        array $relations = []
    ): ?EducationLevel {
        return $this->educationLevelRepository->getById($id, $fields, $relations);
    }

    public function getByKeysEducationLevel(
        string|array|null $keys,
        mixed $values,
        array $fields = ['*'],
        array $relations = []
    ): ?EducationLevel {
        return $this->educationLevelRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function createEducationLevel(array $data): ?EducationLevel
    {
        return $this->educationLevelRepository->create($data);
    }

    public function updateEducationLevel(EducationLevel $educationLevel, array $data): ?EducationLevel
    {
        return $this->educationLevelRepository->update($educationLevel, $data);
    }

    public function deleteEducationLevel(EducationLevel $educationLevel): void
    {
        $this->educationLevelRepository->delete($educationLevel);
    }
}
