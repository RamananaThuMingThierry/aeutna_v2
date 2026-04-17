<?php

namespace App\Providers;

use App\Interfaces\ActivityLogInterface;
use App\Interfaces\AnnualFeeInterface;
use App\Interfaces\AxeInterface;
use App\Interfaces\EducationLevelInterface;
use App\Interfaces\FeePaymentInterface;
use App\Interfaces\FunctionInterface;
use App\Interfaces\MemberInterface;
use App\Interfaces\MemberFunctionInterface;
use App\Interfaces\UserInterface;
use App\Repositories\ActivityLogRepository;
use App\Repositories\AnnualFeeRepository;
use App\Repositories\AxeRepository;
use App\Repositories\EducationLevelRepository;
use App\Repositories\FeePaymentRepository;
use App\Repositories\FunctionRepository;
use App\Repositories\MemberRepository;
use App\Repositories\MemberFunctionRepository;
use App\Repositories\UserRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(ActivityLogInterface::class, ActivityLogRepository::class);
        $this->app->bind(AnnualFeeInterface::class, AnnualFeeRepository::class);
        $this->app->bind(UserInterface::class, UserRepository::class);
        $this->app->bind(AxeInterface::class, AxeRepository::class);
        $this->app->bind(EducationLevelInterface::class, EducationLevelRepository::class);
        $this->app->bind(FeePaymentInterface::class, FeePaymentRepository::class);
        $this->app->bind(FunctionInterface::class, FunctionRepository::class);
        $this->app->bind(MemberInterface::class, MemberRepository::class);
        $this->app->bind(MemberFunctionInterface::class, MemberFunctionRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
