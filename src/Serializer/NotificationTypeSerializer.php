<?php

namespace huseyinfiliz\notificationhub\Serializer;

use Flarum\Api\Serializer\AbstractSerializer;

/**
 * @TODO: Remove this in favor of one of the API resource classes that were added.
 *      Or extend an existing API Resource to add this to.
 *      Or use a vanilla RequestHandlerInterface controller.
 *      @link https://docs.flarum.org/2.x/extend/api#endpoints
 */
class NotificationTypeSerializer extends AbstractSerializer
{
    protected $type = 'notification-types';

    protected function getDefaultAttributes($model): array
    {
        return [
            'name'                => $model->name,
            'excerpt_key'         => $model->excerpt_key,
            'default_url'         => $model->default_url,
            'default_icon'        => $model->default_icon,
            'default_message_key' => $model->default_message_key,
            'is_active'           => $model->is_active,
            'sort_order'          => $model->sort_order,
            'description'         => $model->description,
            'permission'          => $model->permission,
            'color'               => $model->color,
            'default_recipients'  => $model->default_recipients,
            'createdAt'           => $this->formatDate($model->created_at),
            'updatedAt'           => $this->formatDate($model->updated_at),
        ];
    }
}