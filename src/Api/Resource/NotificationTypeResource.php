<?php

namespace HuseyinFiliz\NotificationHub\Api\Resource;

use Flarum\Api\Resource\AbstractDatabaseResource;
use Flarum\Api\Schema;
use HuseyinFiliz\NotificationHub\Model\NotificationHub;

/**
 * This resource is not used for CRUD (those are handled by the custom
 * routes/controllers in src/Controller), it only exists so Flarum's JSON:API
 * layer can resolve a resource type for the NotificationHub model when it
 * is serialized as a notification's "subject" relationship.
 */
class NotificationTypeResource extends AbstractDatabaseResource
{
    public function type(): string
    {
        return 'notification-types';
    }

    public function model(): string
    {
        return NotificationHub::class;
    }

    public function endpoints(): array
    {
        return [];
    }

    public function fields(): array
    {
        return [
            Schema\Str::make('name'),
            Schema\Str::make('excerpt_key')->nullable(),
            Schema\Str::make('default_url')->nullable(),
            Schema\Str::make('default_icon')->nullable(),
            Schema\Str::make('default_message_key')->nullable(),
            Schema\Boolean::make('is_active'),
            Schema\Integer::make('sort_order'),
            Schema\Str::make('description')->nullable(),
            Schema\Str::make('permission')->nullable(),
            Schema\Str::make('color')->nullable(),
            Schema\Str::make('default_recipients')->nullable(),
            Schema\DateTime::make('createdAt')
                ->get(fn (NotificationHub $model) => $model->created_at),
            Schema\DateTime::make('updatedAt')
                ->get(fn (NotificationHub $model) => $model->updated_at),
        ];
    }
}
