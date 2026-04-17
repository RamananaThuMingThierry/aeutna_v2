<?php

namespace Database\Seeders;

use App\Models\EducationLevel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class EducationLevelSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            'Lycée',
            'Baccalauréat',
            'Licence 1',
            'Licence 2',
            'Licence 3',
            'Master 1',
            'Master 2',
            'Doctorat',
            'Autre',
        ];

        foreach ($items as $name) {
            EducationLevel::query()->updateOrCreate(
                ['code' => Str::upper(Str::slug($name, '_'))],
                [
                    'name' => $name,
                    'is_active' => true,
                ]
            );
        }
    }
}
