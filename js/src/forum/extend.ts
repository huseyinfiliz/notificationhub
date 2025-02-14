import Extend from 'flarum/common/extenders';
import Forum from 'flarum/common/models/Forum';
import NotificationType from "./models/NotificationType";

export default [
    new Extend.Model(Forum)
        .attribute('huseyinfilizNotificationAll')
        .attribute('huseyinfilizNotificationUser'),

    new Extend.Store()
        .add('notification-types', NotificationType)
];
