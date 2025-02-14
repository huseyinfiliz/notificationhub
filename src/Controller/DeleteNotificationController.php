<?php

namespace huseyinfiliz\notificationhub\Controller;

use Flarum\Api\Controller\AbstractDeleteController;
use Flarum\Http\RequestUtil;
use huseyinfiliz\notificationhub\Model\NotificationHub;
use Laminas\Diactoros\Response\EmptyResponse;
use Psr\Http\Message\ServerRequestInterface;

class DeleteNotificationController extends AbstractDeleteController
{
    protected function delete(ServerRequestInterface $request)
    {
		$actor = RequestUtil::getActor($request);

        // URL'den gelen 'id' parametresini alıyoruz
        $notificationTypeId = $request->getQueryParams('id'); // 'id' URL parametresi

        $notificationId = NotificationHub::query()
            ->where('id', $notificationTypeId)
            ->first();

        if (!$notificationId) {
            // Eğer bildirim türü bulunmazsa, 404 yanıtı dönüyoruz
            return new EmptyResponse(404);
        }

        // Bildirim türünü siliyoruz
        $notificationId->delete();
        return ['deleted' => 'success'];
    }
}
