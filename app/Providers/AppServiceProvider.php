<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Schema;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Collection;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        // Forzar HTTPS en todas las URLs generadas por Laravel
        URL::forceScheme('https');
        
        // Configuración para Paginator simple
        if (method_exists(Paginator::class, 'defaultView')) {
            Paginator::defaultView('pagination::default');
            Paginator::defaultSimpleView('pagination::simple-default');
        }
    }
}