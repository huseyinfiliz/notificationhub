<?php

namespace huseyinfiliz\notificationhub\Controller;

use Flarum\Api\Controller\AbstractDeleteController;
use Flarum\Http\RequestUtil;
use huseyinfiliz\notificationhub\Model\NotificationHub;
use Illuminate\Support\Arr;
use Psr\Http\Message\ServerRequestInterface;

class DeleteNotificationController extends AbstractDeleteController
{
    protected function delete(ServerRequestInterface $request): void
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
    }
}