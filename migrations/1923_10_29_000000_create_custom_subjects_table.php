<?php

use Illuminate\Database\Schema\Builder;
use Illuminate\Database\Schema\Blueprint;

return [
    'up' => function (Builder $schema) {
        $schema->create('notification_hub', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->string('excerpt_key')->nullable();
            $table->string('default_icon')->nullable();
            $table->string('default_message_key')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->string('permission')->nullable();
            $table->string('color')->nullable();
            $table->string('default_url')->nullable();
            $table->text('default_recipients')->nullable();
            $table->timestamps();
        });
    },
    'down' => function (Builder $schema) {
        $schema->dropIfExists('notification_hub');
    }
];
