import Model from 'flarum/common/Model';

export default class Notification extends Model {
    notification = Model.attribute<string>('notification');
}
