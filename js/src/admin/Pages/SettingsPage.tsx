import app from 'flarum/admin/app';
import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import Button from 'flarum/common/components/Button';
import Alert from 'flarum/common/components/Alert';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import Modal from 'flarum/common/components/Modal';
import { IInternalModalAttrs } from 'flarum/common/components/Modal';

interface NotificationTypeAttributes {
    id?: number;
    name: string;
    excerpt_key: string;
    default_icon: string | null;
    default_message_key: string | null;
    description: string | null;
    is_active: boolean;
    sort_order: number;
    permission: string | null;
    color: string | null;
    default_url: string | null;
    default_recipients: string | null;
}

interface NotificationType {
    id: string;
    type: string;
    attributes: NotificationTypeAttributes;
}
interface NotificationTypeModalAttrs extends IInternalModalAttrs {
    notificationType?: NotificationType;
    onSave: (notificationType: NotificationType) => void;
}
class AddNotificationTypeModal extends Modal<NotificationTypeModalAttrs> {
    private formData: Partial<NotificationTypeAttributes>;
    private sending: boolean = false;

    oninit(vnode: any) {
        super.oninit(vnode);
        // Düzenleme modunda (notificationType varsa) formData'yı API'den gelen veriyle doldur
        if (this.attrs.notificationType) {
          this.formData = { ...this.attrs.notificationType.attributes };
        } else {
          // Ekleme modundaysa varsayılan değerleri kullan
          this.formData = {
              name: '',
              excerpt_key: '',
              default_icon: 'fas fa-bell',
              default_message_key: null,
              description: null,
              is_active: true,
              sort_order: 1,
              permission: null,
              color: null,
              default_url: null,
              default_recipients: null
          };
        }
    }

    className() {
        return 'NotificationTypeModal Modal--large';
    }

    title() {
        return app.translator.trans(
            'huseyinfiliz-notificationhub.admin.settings.' +
            (this.attrs.notificationType ? 'edit_notification_type' : 'add_notification_type')
        );
    }

    content() {
        const t = (key: string) => app.translator.trans('huseyinfiliz-notificationhub.admin.settings.' + key);

        return m('.Modal-body', [
            m('form.Form', {
                onsubmit: this.onsubmit.bind(this)
            }, [
                // Form grupları (artık düzenleme modunda devre dışı DEĞİL)
                this.buildFormGroup('name', 'text', t('fields.name')),
                this.buildFormGroup('description', 'text', t('fields.description')),
                this.buildFormGroup('default_icon', 'text', t('fields.icon')),
                this.buildFormGroup('default_message_key', 'text', t('fields.default_message_key')),
                this.buildFormGroup('default_url', 'text', t('fields.default_url')),
                this.buildFormGroup('excerpt_key', 'text', t('fields.excerpt_key')),
                //this.buildFormGroup('permission', 'text', t('fields.permission')),
                //this.buildFormGroup('color', 'text', t('fields.color')),
                //this.buildFormGroup('default_recipients', 'text', t('fields.default_recipients')),
                //this.buildFormGroup('sort_order', 'number', t('fields.sort_order')),

                // Active checkbox (artık düzenleme modunda devre dışı DEĞİL)
                m('.Form-group', [
                    m('label.checkbox', [
                        m('input[type=checkbox]', {
                            checked: this.formData.is_active,
                            onchange: (e: InputEvent) => {
                                this.formData.is_active = (e.target as HTMLInputElement).checked;
                            },
                            disabled: this.sending // Sadece gönderme işlemi sırasında devre dışı
                        }),
                        ' ',
                        t('fields.active')
                    ])
                ]),

                // Submit button (artık düzenleme modunda devre dışı DEĞİL)
                m('.Form-group', [
                    Button.component({
                        type: 'submit',
                        className: 'Button Button--primary',
                        loading: this.sending,
                        disabled: !this.formData.name // Sadece zorunlu alanlar boşsa devre dışı
                    }, t('save'))
                ])
            ])
        ]);
    }

    // buildFormGroup metodunda disabled parametresini kullanmıyoruz
    private buildFormGroup(field: keyof NotificationTypeAttributes, type: string, label: string) {
        return m('.Form-group', [
            m('label', label),
            m('input.FormControl', {
                type: type,
                value: this.formData[field] || '',
                oninput: (e: InputEvent) => {
                    const value = (e.target as HTMLInputElement).value;
                    this.formData[field] = type === 'number' ? parseInt(value, 10) : value; // parseInt ekledik.
                },
                disabled: this.sending // Sadece gönderme işlemi sırasında devre dışı
            })
        ]);
    }

    onsubmit(e: SubmitEvent) {
        e.preventDefault();
        this.sending = true;

        const isNew = !this.attrs.notificationType;
        const url = isNew
            ? `${app.forum.attribute('apiUrl')}/notification-types-create`
            : `${app.forum.attribute('apiUrl')}/notification-types/${this.attrs.notificationType?.id}`; // Doğru ID kullanımı

        // API isteği
        app.request({
            method: isNew ? 'POST' : 'PATCH',
            url: url,
            body: { data: { type: 'notification-types', attributes: this.formData, ...(isNew ? {} : { id: this.attrs.notificationType!.id }) } }, // id'yi gönder (sadece güncelleme için)
        })
        .then((response: any) => { // `any` tipini geçici olarak kullanıyoruz.
            // Başarılı
          this.attrs.onSave(response.data);  // SettingsPage'deki onSave fonksiyonuna güncellenmiş veriyi gönder
          this.hide();
        })
        .catch(error => {
            // Hata işleme
            this.sending = false; // Gönderme durumunu sıfırla
            console.error("Error saving notification type:", error);
            // Kullanıcıya hata mesajı göster (isteğe bağlı)
            m.redraw();
        });
    }
}


export default class SettingsPage extends ExtensionPage {
    private notificationTypes: NotificationType[] | null = null;
    private loading: boolean = false;
    private error: string | null = null;

    oninit(vnode: any) {
        super.oninit(vnode);
        this.loadNotificationTypes();
    }

  content() {
    return m('.NotificationHubSettingsPage', [
        m('.container', [
            m('.NotificationTypesPage-header', [

            ]),
            this.buildContent(),
        ]),
    ]);
  }

  private buildContent() {
    if (this.loading) {
        return m('.NotificationTypesPage-loading', LoadingIndicator.component());
    }

    if (this.error) {
        return m('.NotificationTypesPage-error', Alert.component({ type: 'error' }, this.error));
    }

    return m('.NotificationTypesPage-content', [ // .NotificationTypesPage-list yerine .NotificationTypesPage-content
        m('.header', { className: 'header' }, [ // div yerine m('.header')
            m('h1', app.translator.trans('huseyinfiliz-notificationhub.admin.title.page_title')), // Başlık
            m('button', {
                className: 'add-button',
                onclick: () => this.showAddModal()
            }, [
                m('i', { className: 'fas fa-plus' }),
                ' ', // Ara boşluk
                app.translator.trans('huseyinfiliz-notificationhub.admin.settings.add_button') // "Add New" çevirisi
            ])
        ]),

        m('.separator', { className: 'separator' }), // div yerine m('.separator')

        m('.notification-list', { className: 'notification-list' }, // div yerine m('.notification-list')
            this.notificationTypes && this.notificationTypes.length > 0 ? (
                this.notificationTypes.map((type) =>
                    m('.notification-card', { className: 'notification-card' }, [ // div yerine m('.notification-card')
                        m('.status-indicator', { className: 'status-indicator ' + (type.attributes?.is_active ? 'active' : 'inactive') }), // div yerine m('.status-indicator'), active/inactive class'ı dinamik
                        m('.notification-icon', { className: 'notification-icon' }, // div yerine m('.notification-icon')
                            m('i', { className: type.attributes?.default_icon || 'fas fa-bell' }) // Bildirim ikonu, varsayılan ikon fallback ile
                        ),
                        m('.notification-content', { className: 'notification-content' }, [ // div yerine m('.notification-content')
                            m('.notification-title', { className: 'notification-title' }, [ // div yerine m('.notification-title')
                                m('span', { className: 'notification-name' }, type.attributes?.name), // Bildirim adı
                            ]),
                            m('.notification-description', { className: 'notification-description' }, type.attributes?.description), // Bildirim açıklaması
                        ]),
                        m('.notification-actions', { className: 'notification-actions' }, [ // div yerine m('.notification-actions')
                            m('button', {
                                className: 'action-button',
                                onclick: () => this.showEditModal(type)
                            }, m('i', { className: 'fas fa-edit' })), // Düzenle butonu
                            m('button', {
                                className: 'action-button delete',
                                onclick: () => this.deleteNotificationType(type.id)
                            }, m('i', { className: 'fas fa-trash' })), // Sil butonu
                        ]),
                    ])
                )
            ) : (
                m('.NotificationTypesPage-empty', app.translator.trans('huseyinfiliz-notificationhub.admin.settings.no_data')) // Veri yoksa mesaj
            )
        ),
    ]);
  }


    private showAddModal() {
        app.modal.show(AddNotificationTypeModal, {
            onSave: (type: NotificationType) => {
                this.notificationTypes = [...(this.notificationTypes || []), type];
                m.redraw();
            }
        });
    }

    private showEditModal(type: NotificationType) {
        app.modal.show(AddNotificationTypeModal, {
            notificationType: type,
            onSave: (updatedType: NotificationType) => {
                this.notificationTypes = this.notificationTypes!.map(item =>
                    item.id === updatedType.id ? updatedType : item
                );
                m.redraw();
            }
        });
    }

    async loadNotificationTypes() {
        this.loading = true;
        this.error = null;
        m.redraw();

        try {
            const response = await app.request({
                method: 'GET',
                url: `${app.forum.attribute('apiUrl')}/notification-types`
            });
            this.notificationTypes = response.data;
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
                url: `${app.forum.attribute('apiUrl')}/notification-types-delete/${id}`
            });

            this.notificationTypes = this.notificationTypes!.filter(type => type.id !== id);
            m.redraw();
        } catch (e: any) {
            this.error = e.message || 'Failed to delete notification type';
            m.redraw();
        }
    }
}
