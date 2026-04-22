<?php

namespace Database\Seeders;

use App\Models\Axe;
use Illuminate\Database\Seeder;

class AxeSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['name' => 'Autres', 'code' => 'AUTRES'],
            ['name' => 'Ankavanana', 'code' => 'ANKAVANANA'],
            ['name' => 'Ankavia', 'code' => 'ANKAVIA'],
            ['name' => 'Cap-Est', 'code' => 'CAP-EST'],
            ['name' => 'Antalaha Ville', 'code' => 'ANTALAHA'],
            ['name' => 'Andrarony', 'code' => 'ANDRARONY'],
            ['name' => 'Andempona', 'code' => 'ANDEMOPONA'],
        ];

        foreach ($items as $item) {
            Axe::query()->updateOrCreate(
                ['code' => $item['code']],
                [
                    'name' => $item['name'],
                    'is_active' => true,
                ]
            );
        }
    }
}
