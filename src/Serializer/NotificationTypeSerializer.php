<?php

namespace HuseyinFiliz\NotificationHub\Serializer;

use HuseyinFiliz\NotificationHub\Model\NotificationHub;

class NotificationTypeSerializer
{
    public static function attributes(NotificationHub $model): array
    {
        return [
            'name' => $model->name,
            'excerpt_key' => $model->excerpt_key,
            'default_url' => $model->default_url,
            'default_icon' => $model->default_icon,
            'default_message_key' => $model->default_message_key,
            'is_active' => (bool) $model->is_active,
            'sort_order' => $model->sort_order,
            'description' => $model->description,
            'permission' => $model->permission,
            'color' => $model->color,
            'default_recipients' => $model->default_recipients,
            'createdAt' => self::formatDate($model->created_at),
            'updatedAt' => self::formatDate($model->updated_at),
        ];
    }

    public static function resource(NotificationHub $model): array
    {
        return [
            'type' => 'notification-types',
            'id' => (string) $model->id,
            'attributes' => self::attributes($model),
        ];
    }

    protected static function formatDate($date): ?string
    {
        return $date ? $date->toIso8601String() : null;
    }
}
