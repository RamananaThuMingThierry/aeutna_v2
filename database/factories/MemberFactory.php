<?php

namespace Database\Factories;

use App\Models\Axe;
use App\Models\EducationLevel;
use App\Models\Member;
use App\Models\MemberApplication;
use Illuminate\Database\Eloquent\Factories\Factory;

class MemberFactory extends Factory
{
    protected $model = Member::class;

    public function definition(): array
    {
        $joinedAt = fake()->dateTimeBetween('-4 years', 'now');

        return [
            'user_id' => null,
            'application_id' => MemberApplication::factory(),
            'member_type' => fake()->randomElement(['member', 'bureau']),
            'axis_id' => Axe::query()->inRandomOrder()->value('id') ?? Axe::factory(),
            'education_level_id' => EducationLevel::query()->inRandomOrder()->value('id') ?? EducationLevel::factory(),
            'member_number' => (string) fake()->unique()->numberBetween(1000, 99999),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'gender' => fake()->randomElement(['Homme', 'Femme']),
            'birth_date' => fake()->dateTimeBetween('-35 years', '-18 years')->format('Y-m-d'),
            'birth_place' => fake()->city(),
            'photo' => null,
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'alternative_phone' => fake()->optional()->phoneNumber(),
            'address' => fake()->streetAddress(),
            'city' => fake()->city(),
            'institution_name' => fake()->company(),
            'field_of_study' => fake()->words(3, true),
            'is_student' => fake()->boolean(70),
            'is_sympathizer' => fake()->boolean(25),
            'is_from_antalaha' => fake()->boolean(60),
            'status' => fake()->randomElement(['pending', 'active', 'inactive', 'suspended', 'archived']),
            'joined_at' => $joinedAt->format('Y-m-d'),
            'notes' => fake()->optional()->paragraph(),
        ];
    }
}
