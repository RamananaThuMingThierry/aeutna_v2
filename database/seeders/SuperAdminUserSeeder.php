<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SuperAdminUserSeeder extends Seeder
{
    /**
     * Seed the default super admin user and attach its role.
     */
    public function run(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'ramananathumingthierry@gmail.com'],
            [
                'name' => 'RAMANANA Thu Ming Thierry',
                'password' => 'password',
                'phone' => '0327563770',
                'email_verified_at' => now(),
            ]
        );

        $roleId = Role::query()
            ->where('code', 'super_admin')
            ->value('id');

        if ($roleId === null) {
            $this->command?->warn('Role "super_admin" introuvable. Association ignoree.');

            return;
        }

        DB::table('role_users')->upsert([
            [
                'role_id' => $roleId,
                'user_id' => $user->id,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ], ['role_id', 'user_id'], ['updated_at']);
    }
}
