import Extend from 'flarum/common/extenders';
import Forum from 'flarum/common/models/Forum';

export default [
    new Extend.Model(Forum)
        .attribute('huseyinfilizNotificationAll')
        .attribute('huseyinfilizNotificationUser'),
];
