<?php

namespace HuseyinFiliz\NotificationHub;

use Flarum\Api\Resource\ForumResource;
use Flarum\Api\Schema;
use Flarum\Extend;
use HuseyinFiliz\NotificationHub\Api\Resource\NotificationTypeResource;
use HuseyinFiliz\NotificationHub\Notification\CustomNotificationBlueprint;
use HuseyinFiliz\NotificationHub\Controller\SendNotificationController;
use HuseyinFiliz\NotificationHub\Controller\UpdateNotificationController;
use HuseyinFiliz\NotificationHub\Controller\CreateNotificationController;
use HuseyinFiliz\NotificationHub\Controller\ListNotificationController;
use HuseyinFiliz\NotificationHub\Controller\DeleteNotificationController;
use HuseyinFiliz\NotificationHub\Content\AddForumPayload;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__ . '/js/dist/forum.js')
        ->css(__DIR__ . '/resources/less/forum.less')
        ->content(AddForumPayload::class),

    (new Extend\Frontend('admin'))
        ->js(__DIR__ . '/js/dist/admin.js')
        ->css(__DIR__ . '/resources/less/admin.less'),

    (new Extend\Locales(__DIR__ . '/resources/locale')),

    (new Extend\Notification())
        ->type(CustomNotificationBlueprint::class, ['alert']),

    new Extend\ApiResource(NotificationTypeResource::class),

    (new Extend\Routes('api'))
        ->get('/notification-types', 'huseyinfiliz.notification-types.list', ListNotificationController::class)
        ->post('/notification-types-create', 'huseyinfiliz.notification-types.create', CreateNotificationController::class)
        ->delete('/notification-types-delete/{id}', 'huseyinfiliz.notification-types.delete', DeleteNotificationController::class)
        ->patch('/notification-types/{id}', 'huseyinfiliz.notification-types.update', UpdateNotificationController::class)
        ->post('/notifications/send', 'huseyinfiliz.notification.send', SendNotificationController::class),

    (new Extend\ApiResource(ForumResource::class))
        ->fields(fn () => [
            Schema\Boolean::make('huseyinfilizNotificationAll')
                ->get(fn ($model, $context) => $context->getActor()->can('huseyinfiliz-notificationhub.send-all')),

            Schema\Boolean::make('huseyinfilizNotificationUser')
                ->get(fn ($model, $context) => $context->getActor()->can('huseyinfiliz-notificationhub.send-user')),
        ]),
];
