<?php

namespace Database\Seeders;

use App\Models\Functions;
use App\Models\Member;
use Illuminate\Database\Seeder;

class MemberSeeder extends Seeder
{
    public function run(): void
    {
        $members = Member::factory()->count(12)->create();
        $executiveFunctionIds = Functions::query()
            ->where('is_executive', true)
            ->pluck('id');

        if ($executiveFunctionIds->isEmpty()) {
            return;
        }

        $bureauMembers = $members->where('member_type', 'bureau');

        foreach ($bureauMembers as $member) {
            $selectedIds = $executiveFunctionIds
                ->shuffle()
                ->take(fake()->numberBetween(1, min(2, $executiveFunctionIds->count())));

            foreach ($selectedIds as $functionId) {
                $member->memberFunctions()->create([
                    'function_id' => $functionId,
                    'start_date' => $member->joined_at,
                    'end_date' => null,
                    'is_current' => true,
                    'notes' => 'Fonction de demonstration.',
                ]);
            }
        }
    }
}
