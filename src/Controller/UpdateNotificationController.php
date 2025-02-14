<?php

namespace huseyinfiliz\notificationhub\Controller;

//use Flarum\Api\Controller\AbstractCreateController; // AbstractCreateController yerine AbstractShowController daha uygun.
use Flarum\Api\Controller\AbstractShowController; // AbstractShowController kullanıyoruz.
use huseyinfiliz\notificationhub\Model\NotificationHub;
use Psr\Http\Message\ServerRequestInterface as Request;
use Tobscure\JsonApi\Document;
use huseyinfiliz\notificationhub\Serializer\NotificationTypeSerializer;
use Flarum\Http\RequestUtil; // RequestUtil'i ekledik.
use Illuminate\Support\Arr; // Arr'ı ekledik

class UpdateNotificationController extends AbstractShowController // AbstractShowController kullanıyoruz
{
    public $serializer = NotificationTypeSerializer::class;

    protected $notificationHub;

    public function __construct(NotificationHub $notificationHub)
    {
        $this->notificationHub = $notificationHub;
    }

    protected function data(Request $request, Document $document)
    {
        // Güncelleyen kullanıcıyı alıyoruz
        $actor = RequestUtil::getActor($request);

        // Yetki kontrolü (örneğin, yönetici veya belirli bir izin)
       if (!$actor->can('huseyinfiliz-notificationhub.send-all')) {
           throw new \Flarum\User\Exception\PermissionDeniedException();
       }

        // Güncellenecek bildirim türünün ID'sini al (URL'den)
        $id = Arr::get($request->getQueryParams(), 'id'); // Arr::get kullanıyoruz.

        // Bildirim türünü ID'ye göre bul
        $notificationType = $this->notificationHub->findOrFail($id);

        // İstekten gelen verileri al
        $data = $request->getParsedBody();
        $attributes = Arr::get($data, 'data.attributes', []); // Arr::get ile güvenli erişim

        // Modelin update metodu ile güncelleme
        $notificationType->update($attributes);


        return $notificationType; // Güncellenmiş türü döndür
    }
}
