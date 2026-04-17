<?php

namespace Database\Factories;

use App\Models\Functions;
use App\Models\Member;
use App\Models\MemberFunction;
use Illuminate\Database\Eloquent\Factories\Factory;

class MemberFunctionFactory extends Factory
{
    protected $model = MemberFunction::class;

    public function definition(): array
    {
        $startDate = fake()->dateTimeBetween('-3 years', '-1 month');

        return [
            'member_id' => Member::factory(),
            'function_id' => Functions::query()->inRandomOrder()->value('id') ?? Functions::factory(),
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => null,
            'is_current' => true,
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
