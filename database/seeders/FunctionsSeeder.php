<?php

namespace Database\Seeders;

use App\Models\Functions;
use Illuminate\Database\Seeder;

class FunctionsSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['name' => 'Président', 'code' => 'PRESIDENT', 'is_executive' => true],
            ['name' => 'Vice-président', 'code' => 'VICE_PRESIDENT', 'is_executive' => true],
            ['name' => 'Secrétaire général', 'code' => 'SECRETAIRE_GENERAL', 'is_executive' => true],
            ['name' => 'Trésorier', 'code' => 'TRESORIER', 'is_executive' => true],
            ['name' => 'Commissaire aux comptes', 'code' => 'COMMISSAIRE_COMPTES', 'is_executive' => false],
            ['name' => 'Responsable communication', 'code' => 'RESP_COMMUNICATION', 'is_executive' => true],
            ['name' => 'Responsable sport', 'code' => 'RESP_SPORT', 'is_executive' => true],
            ['name' => 'Membre actif', 'code' => 'MEMBRE_ACTIF', 'is_executive' => false],
        ];

        foreach ($items as $item) {
            Functions::query()->updateOrCreate(
                ['code' => $item['code']],
                [
                    'name' => $item['name'],
                    'is_executive' => $item['is_executive'],
                    'is_active' => true,
                ]
            );
        }
    }
}
