<?php

namespace huseyinfiliz\notificationhub\Controller;

use Flarum\Api\Controller\AbstractDeleteController;
use Flarum\Http\RequestUtil;
use huseyinfiliz\notificationhub\Model\NotificationHub;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\EmptyResponse;
use Psr\Http\Message\ServerRequestInterface;

/**
 * @TODO: Remove this in favor of one of the API resource classes that were added.
 *      Or extend an existing API Resource to add this to.
 *      Or use a vanilla RequestHandlerInterface controller.
 *      @link https://docs.flarum.org/2.x/extend/api#endpoints
 */
class DeleteNotificationController extends AbstractDeleteController
{
    protected function delete(ServerRequestInterface $request): void
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