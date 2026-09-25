<?php

// Supabase Storage: the S3 endpoint can be derived from the project URL
// (https://<project-ref>.supabase.co → https://<project-ref>.storage.supabase.co),
// so production only needs SUPABASE_URL + the S3 access keys (docs/storage.md).
$supabaseUrl = rtrim((string) (env('SUPABASE_URL') ?: ($_ENV['SUPABASE_URL'] ?? '')), '/');
$supabaseHost = $supabaseUrl !== '' ? (string) parse_url($supabaseUrl, PHP_URL_HOST) : '';
$supabaseProjectRef = (string) (env('SUPABASE_PROJECT_REF') ?: ($_ENV['SUPABASE_PROJECT_REF'] ?? '')
    ?: ($supabaseHost !== '' ? preg_replace('/\.supabase\.co$/', '', $supabaseHost) : ''));

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    'product_images_disk' => env('FILESYSTEM_DISK_PRODUCT_IMAGES', 'public'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim((string) env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

        'supabase' => [
            'driver' => 's3',
            'key' => env('SUPABASE_ACCESS_KEY_ID', env('AWS_ACCESS_KEY_ID')),
            'secret' => env('SUPABASE_SECRET_ACCESS_KEY', env('AWS_SECRET_ACCESS_KEY')),
            'region' => env('SUPABASE_DEFAULT_REGION', env('AWS_DEFAULT_REGION', 'us-east-1')),
            'bucket' => env('SUPABASE_BUCKET', env('SUPABASE_STORAGE_BUCKET', env('AWS_BUCKET', 'product-images'))),
            'url' => $supabaseUrl !== '' ? $supabaseUrl.'/storage/v1/object/public/'.env('SUPABASE_BUCKET', env('SUPABASE_STORAGE_BUCKET', 'product-images')) : env('AWS_URL'),
            'endpoint' => (env('SUPABASE_ENDPOINT') ?: ($_ENV['SUPABASE_ENDPOINT'] ?? null))
                ?: (env('SUPABASE_S3_ENDPOINT') ?: ($_ENV['SUPABASE_S3_ENDPOINT'] ?? null))
                ?: ($supabaseProjectRef !== '' ? 'https://'.$supabaseProjectRef.'.storage.supabase.co/storage/v1/s3' : null)
                ?: env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('SUPABASE_USE_PATH_STYLE_ENDPOINT', env('AWS_USE_PATH_STYLE_ENDPOINT', true)),
            'visibility' => 'public',
            'throw' => false,
            'report' => true,
        ],

        'product-images' => [
            'driver' => 'local',
            'root' => storage_path('app/public/product-images'),
            'url' => rtrim((string) env('APP_URL', 'http://localhost'), '/').'/storage/product-images',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
