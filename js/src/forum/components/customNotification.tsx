import app from 'flarum/forum/app';
import Notification from 'flarum/forum/components/Notification';
import { getContrastTextColor } from '../../common/utils/color';

export default class CustomNotification extends Notification {
  icon() {
    return this.attrs.notification?.content()?.icon;
  }

  href() {
    return this.attrs.notification?.content()?.url;
  }

  excerpt() {
    return this.attrs.notification?.content()?.excerpt;
  }

  content() {
    const message = this.attrs.notification?.content()?.message;
    return m('div', message);
  }

  view(vnode: any) {
    const view = super.view(vnode);
    const color = this.attrs.notification?.content()?.color;
    if (color && view && view.attrs) {
      const textColor = getContrastTextColor(color);
      view.attrs.style = {
        ...view.attrs.style,
        backgroundColor: color,
        ...(textColor ? { '--notificationhub-text-color': textColor } : {}),
      };
    }
    return view;
  }
}
