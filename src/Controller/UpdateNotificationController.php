<?php

namespace HuseyinFiliz\NotificationHub\Controller;

use Flarum\Foundation\ValidationException;
use Flarum\Http\RequestUtil;
use Flarum\User\Exception\PermissionDeniedException;
use HuseyinFiliz\NotificationHub\Model\NotificationHub;
use HuseyinFiliz\NotificationHub\Serializer\NotificationTypeSerializer;
use HuseyinFiliz\NotificationHub\Utils\UrlValidator;
use Illuminate\Contracts\Translation\Translator;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class UpdateNotificationController implements RequestHandlerInterface
{
    public function __construct(protected Translator $translator)
    {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);

        if (!$actor->can('huseyinfiliz-notificationhub.send-all')) {
            throw new PermissionDeniedException();
        }

        $id = Arr::get($request->getAttribute('routeParameters'), 'id');
        $notificationType = NotificationHub::findOrFail($id);

        $data = $request->getParsedBody();
        $attributes = Arr::get($data, 'data.attributes', []);

        $dirty = [];

        if (Arr::has($attributes, 'name')) {
            $name = trim((string) Arr::get($attributes, 'name'));
            if (empty($name)) {
                throw new ValidationException(['name' => [$this->translator->trans('huseyinfiliz-notificationhub.api.name_required')]]);
            }
            if (mb_strlen($name, 'UTF-8') > 255) {
                throw new ValidationException(['name' => [$this->translator->trans('huseyinfiliz-notificationhub.api.name_too_long')]]);
            }
            $dirty['name'] = $name;
        }

        if (Arr::has($attributes, 'default_url')) {
            $dirty['default_url'] = UrlValidator::validate((string) Arr::get($attributes, 'default_url'), $this->translator, 'default_url');
        }

        if (Arr::has($attributes, 'is_active')) {
            $dirty['is_active'] = (bool) Arr::get($attributes, 'is_active');
        }

        if (Arr::has($attributes, 'sort_order')) {
            $value = Arr::get($attributes, 'sort_order');
            if (!is_numeric($value) || (int) $value < 0) {
                throw new ValidationException(['sort_order' => [$this->translator->trans('huseyinfiliz-notificationhub.api.sort_order_invalid')]]);
            }
            $dirty['sort_order'] = (int) $value;
        }

        if (Arr::has($attributes, 'excerpt_key')) {
            $val = (string) Arr::get($attributes, 'excerpt_key', '');
            if (mb_strlen($val, 'UTF-8') > 255) {
                throw new ValidationException(['excerpt_key' => [$this->translator->trans('huseyinfiliz-notificationhub.api.field_too_long')]]);
            }
            $dirty['excerpt_key'] = $val !== '' ? $val : null;
        }

        if (Arr::has($attributes, 'default_icon')) {
            $val = (string) Arr::get($attributes, 'default_icon', '');
            if (mb_strlen($val, 'UTF-8') > 255) {
                throw new ValidationException(['default_icon' => [$this->translator->trans('huseyinfiliz-notificationhub.api.field_too_long')]]);
            }
            $dirty['default_icon'] = $val !== '' ? $val : null;
        }

        if (Arr::has($attributes, 'default_message_key')) {
            $val = (string) Arr::get($attributes, 'default_message_key', '');
            if (mb_strlen($val, 'UTF-8') > 500) {
                throw new ValidationException(['default_message_key' => [$this->translator->trans('huseyinfiliz-notificationhub.api.field_too_long')]]);
            }
            $dirty['default_message_key'] = $val !== '' ? $val : null;
        }

        if (Arr::has($attributes, 'description')) {
            $val = (string) Arr::get($attributes, 'description', '');
            if (mb_strlen($val, 'UTF-8') > 1000) {
                throw new ValidationException(['description' => [$this->translator->trans('huseyinfiliz-notificationhub.api.field_too_long')]]);
            }
            $dirty['description'] = $val !== '' ? $val : null;
        }

        if (Arr::has($attributes, 'permission')) {
            $val = (string) Arr::get($attributes, 'permission', '');
            if (mb_strlen($val, 'UTF-8') > 255) {
                throw new ValidationException(['permission' => [$this->translator->trans('huseyinfiliz-notificationhub.api.field_too_long')]]);
            }
            $dirty['permission'] = $val !== '' ? $val : null;
        }

        if (Arr::has($attributes, 'color')) {
            $val = (string) Arr::get($attributes, 'color', '');
            if (mb_strlen($val, 'UTF-8') > 32) {
                throw new ValidationException(['color' => [$this->translator->trans('huseyinfiliz-notificationhub.api.field_too_long')]]);
            }
            if ($val !== '' && !preg_match('/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/', $val)) {
                throw new ValidationException(['color' => [$this->translator->trans('huseyinfiliz-notificationhub.api.invalid_color')]]);
            }
            $dirty['color'] = $val !== '' ? $val : null;
        }

        if (Arr::has($attributes, 'default_recipients')) {
            $val = (string) Arr::get($attributes, 'default_recipients', '');
            if (mb_strlen($val, 'UTF-8') > 5000) {
                throw new ValidationException(['default_recipients' => [$this->translator->trans('huseyinfiliz-notificationhub.api.field_too_long')]]);
            }
            $dirty['default_recipients'] = $val !== '' ? $val : null;
        }

        $notificationType->update($dirty);

        return new JsonResponse([
            'data' => NotificationTypeSerializer::resource($notificationType),
        ]);
    }
}
