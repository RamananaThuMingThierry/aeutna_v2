<?php

namespace App\Repositories;

use App\Interfaces\SlideInterface;
use App\Models\Slide;

class SlideRepository extends BaseRepository implements SlideInterface
{
    public function getAll(string|array|null $keys, mixed $values, array $fields = [], array $relations = [], ?int $paginate = null, array $orderBy = ['id' => 'desc'])
    {
        $fields = $this->withRequiredColumns($fields);

        $q = Slide::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);
        $q = $this->applyOrderBy($q, $orderBy);

        return $paginate ? $q->paginate($paginate, $fields) : $q->get($fields);
    }

    public function getById(int|string|null $id, array $fields = [], array $relations = []): ?Slide
    {
        $fields = $this->withRequiredColumns($fields);

        $q = Slide::query();
        $q = $this->applyRelation($q, $relations);

        return $q->findOrFail($id, $fields);
    }

    public function getByKeys(string|array|null $keys, mixed $values, array $fields = [], array $relations = []): ?Slide
    {
        $fields = $this->withRequiredColumns($fields);

        $q = Slide::query();
        $q = $this->applyRelation($q, $relations);
        $q = $this->applyFilter($q, $keys, $values);

        return $q->first($fields);
    }

    public function create(array $data): ?Slide
    {
        return Slide::create($data);
    }

    public function update(Slide $slide, array $data): ?Slide
    {
        $slide->update($data);
        return $slide;
    }

    public function delete(Slide $slide): void
    {
        $slide->delete();
    }
}
