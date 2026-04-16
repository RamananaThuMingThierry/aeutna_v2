<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    /**
     * Seed the application's roles.
     */
    public function run(): void
    {
        $now = now();

        DB::table('roles')->upsert([
            [
                'name' => 'Super Admin',
                'code' => 'super_admin',
                'description' => 'Acces complet a toutes les fonctionnalites.',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Admin',
                'code' => 'admin',
                'description' => 'Gestion globale de la plateforme.',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Bureau',
                'code' => 'bureau',
                'description' => 'Gestion operationnelle de l association.',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Member',
                'code' => 'member',
                'description' => 'Role standard attribue aux adherents.',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ], ['code'], ['name', 'description', 'is_active', 'updated_at']);
    }
}
