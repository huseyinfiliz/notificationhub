<?php

namespace huseyinfiliz\notificationhub\Content;

use Flarum\Frontend\Document;
use Flarum\Http\RequestUtil;
use Psr\Http\Message\ServerRequestInterface;

class AddForumPayload
{
    public function __invoke(Document $document, ServerRequestInterface $request)
    {
        $actor = RequestUtil::getActor($request);
        
        if ($actor->can('huseyinfiliz-notificationhub.send-all')) {
            $document->payload['notificationTypes']['customNotification'] = 'Custom Notification';
        }
    }
}