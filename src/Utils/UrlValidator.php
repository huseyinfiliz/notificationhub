<?php

namespace huseyinfiliz\notificationhub\Utils;

use Flarum\Foundation\ValidationException;
use Illuminate\Contracts\Translation\Translator;

class UrlValidator
{
    public static function validate(string $url, Translator $translator, string $errorKey = 'url'): ?string
    {
        $url = trim($url);
        if ($url === '' || $url === '#') {
            return $url === '' ? null : $url;
        }

        $isValidUrl = preg_match('/^(https?:\/\/|\/(?!\/)|mailto:|tel:)/i', $url);
        
        if (!$isValidUrl) {
            throw new ValidationException([$errorKey => [$translator->trans('huseyinfiliz-notificationhub.api.invalid_url_scheme')]]);
        }

        if (mb_strlen($url, 'UTF-8') > 2048) {
            throw new ValidationException([$errorKey => [$translator->trans('huseyinfiliz-notificationhub.api.url_too_long')]]);
        }

        return $url;
    }
}