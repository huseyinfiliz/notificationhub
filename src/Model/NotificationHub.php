<?php
namespace huseyinfiliz\notificationhub\Model;

use Flarum\Database\AbstractModel;

class NotificationHub extends AbstractModel
{
    protected $table = 'notification_hub';
	public $timestamps = true;
    protected $fillable = [
        'name',
        'excerpt_key',
        'default_icon',
        'default_message_key',
        'description',
        'is_active',
        'sort_order',
        'permission',
        'color',
        'default_url',
        'default_recipients'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
		'created_at' => 'datetime',
		'updated_at' => 'datetime',
    ];

    // Gereksiz ilişki kaldırıldı
}
