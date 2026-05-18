<?php

namespace huseyinfiliz\notificationhub\Controller;

use Flarum\Api\Controller\AbstractDeleteController;
use Flarum\Http\RequestUtil;
use huseyinfiliz\notificationhub\Model\NotificationHub;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\EmptyResponse;
use Psr\Http\Message\ServerRequestInterface;

class DeleteNotificationController extends AbstractDeleteController
{
    protected function delete(ServerRequestInterface $request)
    {
        $actor = RequestUtil::getActor($request);
        
        $actor->assertCan('huseyinfiliz-notificationhub.send-all');

        $notificationTypeId = Arr::get($request->getAttribute('routeParameters'), 'id');

        $notificationId = NotificationHub::query()
            ->where('id', $notificationTypeId)
            ->first();

        if (!$notificationId) {
            return new EmptyResponse(404);
        }

        $notificationId->delete();
        return ['deleted' => 'success'];
    }
}