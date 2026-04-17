<?php

namespace Database\Factories;

use App\Models\Axe;
use App\Models\EducationLevel;
use App\Models\MemberApplication;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class MemberApplicationFactory extends Factory
{
    protected $model = MemberApplication::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'member_type' => fake()->randomElement(['member', 'bureau']),
            'axis_id' => Axe::query()->inRandomOrder()->value('id') ?? Axe::factory(),
            'education_level_id' => EducationLevel::query()->inRandomOrder()->value('id') ?? EducationLevel::factory(),
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
            'is_sympathizer' => fake()->boolean(30),
            'payment_method' => fake()->randomElement(['mobile_money', 'cash', 'bank_transfer']),
            'payment_reference' => strtoupper(fake()->bothify('PAY-####??')),
            'payment_amount' => fake()->randomFloat(2, 5000, 50000),
            'payment_proof_path' => null,
            'payment_date' => fake()->date(),
            'status' => fake()->randomElement(['draft', 'submitted', 'under_review', 'approved', 'rejected', 'needs_correction']),
            'admin_comment' => fake()->optional()->sentence(),
            'reviewed_by' => null,
            'reviewed_at' => null,
        ];
    }
}
