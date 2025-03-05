<?php

namespace huseyinfiliz\notificationhub\Serializer;

use Flarum\Api\Serializer\AbstractSerializer;

class NotificationTypeSerializer extends AbstractSerializer
{
    protected $type = 'notification-types';

    protected function getDefaultAttributes($model): array
    {
        return [
            'id'                => $model->id,
            'name'              => $model->name,
            'excerpt_key'       => $model->excerpt_key,
            'default_url'       => $model->default_url,
            'default_icon'      => $model->default_icon,
            'default_message_key' => $model->default_message_key,
            'is_active'         => $model->is_active,
            'sort_order'        => $model->sort_order,
            'description'       => $model->description,
            //'permission'        => $model->permission,
            //'color'             => $model->color,
            //'default_recipients' => $model->default_recipients,
            'createdAt'         => $this->formatDate($model->created_at),
            'updatedAt'         => $this->formatDate($model->updated_at),
        ];
    }
}
