<?php

namespace HuseyinFiliz\NotificationHub\Controller;

use Flarum\Http\RequestUtil;
use HuseyinFiliz\NotificationHub\Model\NotificationHub;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\EmptyResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class DeleteNotificationController implements RequestHandlerInterface
{
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);

        $actor->assertCan('huseyinfiliz-notificationhub.send-all');

        $notificationTypeId = Arr::get(
            $request->getAttribute('routeParameters'),
            'id'
        );

        $notificationType = NotificationHub::query()
            ->where('id', $notificationTypeId)
            ->firstOrFail();

        $notificationType->delete();

        return new EmptyResponse(204);
    }
}
