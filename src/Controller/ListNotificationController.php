<?php

namespace HuseyinFiliz\NotificationHub\Controller;

use Flarum\Http\RequestUtil;
use Flarum\User\Exception\PermissionDeniedException;
use HuseyinFiliz\NotificationHub\Model\NotificationHub;
use HuseyinFiliz\NotificationHub\Serializer\NotificationTypeSerializer;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class ListNotificationController implements RequestHandlerInterface
{
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);

        if (!$actor->can('huseyinfiliz-notificationhub.send-all') && !$actor->can('huseyinfiliz-notificationhub.send-user')) {
            throw new PermissionDeniedException();
        }

        $notificationTypes = NotificationHub::get();

        return new JsonResponse([
            'data' => $notificationTypes
                ->map(fn (NotificationHub $model) => NotificationTypeSerializer::resource($model))
                ->all(),
        ]);
    }
}
