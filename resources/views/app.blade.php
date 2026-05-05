<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="app-url" content="{{ url('/') }}">

    <meta name="description" content="AEUTNA rassemble les étudiants natifs d'Antalaha à l'Université de Tananarive autour de l'entraide, des actualités associatives, de la mémoire collective et de la vie communautaire.">
    <meta name="keywords" content="AEUTNA, étudiants Antalaha, Université de Tananarive, association étudiante, actualités AEUTNA, galerie AEUTNA, bureau AEUTNA">
    <meta name="robots" content="index, follow">
    <meta name="author" content="AEUTNA">

    <meta property="og:type" content="website">
    <meta property="og:site_name" content="AEUTNA">
    <meta property="og:locale" content="fr_FR">
    <meta property="og:title" content="{{ config('app.name', 'AEUTNA') }}">
    <meta property="og:description" content="AEUTNA est une Association des Étudiants de l'Université de Tananarivo Natifs d'Antalaha.">
    <meta property="og:url" content="{{ url()->current() }}">
    <meta property="og:image" content="{{ asset('images/logo_aeutna.jpg') }}">

    <link rel="canonical" href="{{ url()->current() }}">
    <link rel="icon" href="{{ asset('images/logo_aeutna.jpg') }}" sizes="any">
    <link rel="apple-touch-icon" href="{{ asset('images/logo_aeutna.jpg') }}">

    <script type="application/ld+json">
        {!! json_encode([
            '@context' => 'https://schema.org',
            '@graph' => [
                [
                    '@type' => 'Organization',
                    '@id' => url('/') . '/#organization',
                    'name' => "Association des Étudiants de l'Université de Tananarive Natifs d'Antalaha",
                    'alternateName' => 'AEUTNA',
                    'url' => url('/') . '/',
                    'logo' => [
                        '@type' => 'ImageObject',
                        'url' => asset('images/logo_aeutna.jpg'),
                    ],
                    'image' => asset('images/logo_aeutna.jpg'),
                    'email' => 'ramananathumingthierry@gmail.com',
                    'telephone' => '+261327563770',
                    'address' => [
                        '@type' => 'PostalAddress',
                        'addressLocality' => 'Antalaha',
                        'addressCountry' => 'MG',
                    ],
                    'sameAs' => [
                        'https://facebook.com/aeutna',
                    ],
                ],
                [
                    '@type' => 'WebSite',
                    '@id' => url('/') . '/#website',
                    'url' => url('/') . '/',
                    'name' => 'AEUTNA',
                    'description' => "AEUTNA est une Association des Étudiants de l'Université de Tananarivo Natifs d'Antalaha.",
                    'inLanguage' => 'fr',
                    'publisher' => [
                        '@id' => url('/') . '/#organization',
                    ],
                ],
                [
                    '@type' => 'WebPage',
                    '@id' => url()->current() . '#webpage',
                    'url' => url()->current(),
                    'name' => config('app.name', 'AEUTNA'),
                    'description' => "AEUTNA est une Association des Étudiants de l'Université de Tananarivo Natifs d'Antalaha.",
                    'inLanguage' => 'fr',
                    'isPartOf' => [
                        '@id' => url('/') . '/#website',
                    ],
                    'about' => [
                        '@id' => url('/') . '/#organization',
                    ],
                    'primaryImageOfPage' => [
                        '@type' => 'ImageObject',
                        'url' => asset('images/logo_aeutna.jpg'),
                    ],
                ],
            ],
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
    </script>

    <title>{{ config('app.name', 'AEUTNA') }}</title>

    @viteReactRefresh
    @vite('resources/js/app.jsx')
</head>

<body>
    <noscript>
        Cette plateforme AEUTNA utilise JavaScript pour afficher l'application et certaines informations publiques.
    </noscript>

    <div id="app"></div>
</body>
</html>