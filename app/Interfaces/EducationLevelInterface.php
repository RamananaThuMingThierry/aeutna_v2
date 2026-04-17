<?php

namespace App\Interfaces;

use App\Models\EducationLevel;

interface EducationLevelInterface{

    public function getAll(string|array|null $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc']);

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?EducationLevel;

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?EducationLevel;

    public function create(array $data): ?EducationLevel;

    public function update(EducationLevel $educationLevel, array $data): ?EducationLevel;

    public function delete(EducationLevel $educationLevel): void;
}
