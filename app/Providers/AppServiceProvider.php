<?php

namespace App\Providers;

use App\Interfaces\ActivityLogInterface;
use App\Interfaces\AxeInterface;
use App\Interfaces\EducationLevelInterface;
use App\Interfaces\UserInterface;
use App\Repositories\ActivityLogRepository;
use App\Repositories\AxeRepository;
use App\Repositories\EducationLevelRepository;
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
        $this->app->bind(UserInterface::class, UserRepository::class);
        $this->app->bind(AxeInterface::class, AxeRepository::class);
        $this->app->bind(EducationLevelInterface::class, EducationLevelRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
