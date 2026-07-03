import app from 'flarum/admin/app';
import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import Alert from 'flarum/common/components/Alert';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import NotificationType from '../../forum/models/NotificationType';
import AddNotificationTypeModal from '../components/AddNotificationTypeModal';

export default class SettingsPage extends ExtensionPage {
  private notificationTypes: NotificationType[] | null = null;
  private loading: boolean = false;
  private error: string | null = null;

  oninit(vnode: any) {
    super.oninit(vnode);
    this.loadNotificationTypes();
  }

  content() {
    return m('.NotificationHubSettingsPage', [m('.container', [this.buildContent()])]);
  }

  private buildContent() {
    if (this.loading) {
      return m('.NotificationTypesPage-loading', LoadingIndicator.component());
    }

    if (this.error) {
      return m('.NotificationTypesPage-error', Alert.component({ type: 'error' }, this.error));
    }

    return m('.NotificationTypesPage-content', [
      m('.header', [
        m('h1', app.translator.trans('huseyinfiliz-notificationhub.admin.title.page_title')),
        m(
          'button.add-button',
          {
            onclick: () => this.showAddModal(),
          },
          [m('i.fas.fa-plus'), ' ', app.translator.trans('huseyinfiliz-notificationhub.admin.settings.add_button')]
        ),
      ]),

      m('.separator'),

      m(
        '.notification-list',
        this.notificationTypes && this.notificationTypes.length > 0
          ? this.notificationTypes.map((type) =>
              m('.notification-card', [
                m('.status-indicator', { className: type.attribute('is_active') ? 'active' : 'inactive' }),
                m('.notification-icon', [m('i', { className: type.attribute('default_icon') || 'fas fa-bell' })]),
                m('.notification-content', [
                  m('.notification-title', [m('span.notification-name', type.attribute('name'))]),
                  m('.notification-description', type.attribute('description')),
                ]),
                m('.notification-actions', [
                  m(
                    'button.action-button',
                    {
                      onclick: () => this.showEditModal(type),
                    },
                    m('i.fas.fa-edit')
                  ),
                  m(
                    'button.action-button.delete',
                    {
                      onclick: () => this.deleteNotificationType(type.id()!),
                    },
                    m('i.fas.fa-trash')
                  ),
                ]),
              ])
            )
          : m('.NotificationTypesPage-empty', app.translator.trans('huseyinfiliz-notificationhub.admin.settings.no_data'))
      ),
    ]);
  }

  private showAddModal() {
    app.modal.show(AddNotificationTypeModal, {
      onSave: (type: NotificationType) => {
        this.notificationTypes = [...(this.notificationTypes || []), type];
        m.redraw();
      },
    });
  }

  private showEditModal(type: NotificationType) {
    app.modal.show(AddNotificationTypeModal, {
      notificationType: type,
      onSave: (updatedType: NotificationType) => {
        this.notificationTypes = this.notificationTypes!.map((item) => (item.id() === updatedType.id() ? updatedType : item));
        m.redraw();
      },
    });
  }

  async loadNotificationTypes() {
    this.loading = true;
    this.error = null;
    m.redraw();

    try {
      await app.store.find('notification-types');
      this.notificationTypes = app.store.all<NotificationType>('notification-types');
    } catch (e: any) {
      this.error = e.message || 'Failed to load notification types';
    } finally {
      this.loading = false;
      m.redraw();
    }
  }

  async deleteNotificationType(id: string) {
    if (!confirm(app.translator.trans('huseyinfiliz-notificationhub.admin.settings.delete_confirm'))) {
      return;
    }

    try {
      await app.request({
        method: 'DELETE',
        url: `${app.forum.attribute('apiUrl')}/notification-types-delete/${id}`,
      });

      this.notificationTypes = this.notificationTypes!.filter((type) => type.id() !== id);
      m.redraw();
    } catch (e: any) {
      this.error = e.message || 'Failed to delete notification type';
      m.redraw();
    }
  }
}
