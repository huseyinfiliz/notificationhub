import Model from 'flarum/common/Model';

export default class NotificationType extends Model {
    name = Model.attribute<string>('name');
    excerpt_key = Model.attribute<string>('excerpt_key');
    default_url = Model.attribute<string>('default_url');
    default_icon = Model.attribute<string>('default_icon', 'fas fa-bell');
    default_message_key = Model.attribute<string>('default_message_key');
    is_active = Model.attribute<boolean>('is_active');
    sort_order = Model.attribute<number>('sort_order');
    createdAt = Model.attribute<Date>('createdAt', Model.transformDate);
    updatedAt = Model.attribute<Date>('updatedAt', Model.transformDate);
}
