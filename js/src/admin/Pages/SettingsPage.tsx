import app from 'flarum/admin/app';
import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import Button from 'flarum/common/components/Button';
import Alert from 'flarum/common/components/Alert';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import Modal from 'flarum/common/components/Modal';
import { IInternalModalAttrs } from 'flarum/common/components/Modal';
import NotificationType from '../../forum/models/NotificationType';

interface NotificationTypeModalAttrs extends IInternalModalAttrs {
    notificationType?: NotificationType;
    onSave: (notificationType: NotificationType) => void;
}
class AddNotificationTypeModal extends Modal<NotificationTypeModalAttrs> {
    private formData: any = {};
    private sending: boolean = false;

    oninit(vnode: any) {
        super.oninit(vnode);
        if (this.attrs.notificationType) {
            this.formData = {
                name: this.attrs.notificationType.attribute('name'),
                description: this.attrs.notificationType.attribute('description'),
                default_icon: this.attrs.notificationType.attribute('default_icon'),
                default_message_key: this.attrs.notificationType.attribute('default_message_key'),
                default_url: this.attrs.notificationType.attribute('default_url'),
                excerpt_key: this.attrs.notificationType.attribute('excerpt_key'),
                is_active: this.attrs.notificationType.attribute('is_active'),
            };
        } else {
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
                this.buildFormGroup('name', 'text', t('fields.name')),
                this.buildFormGroup('description', 'text', t('fields.description')),
                this.buildFormGroup('default_icon', 'text', t('fields.icon')),
                this.buildFormGroup('default_message_key', 'text', t('fields.default_message_key')),
                this.buildFormGroup('default_url', 'text', t('fields.default_url')),
                this.buildFormGroup('excerpt_key', 'text', t('fields.excerpt_key')),

                m('.Form-group', [
                    m('label.checkbox', [
                        m('input[type=checkbox]', {
                            checked: this.formData.is_active,
                            onchange: (e: InputEvent) => {
                                this.formData.is_active = (e.target as HTMLInputElement).checked;
                            },
                            disabled: this.sending
                        }),
                        ' ',
                        t('fields.active')
                    ])
                ]),

                m('.Form-group', [
                    Button.component({
                        type: 'submit',
                        className: 'Button Button--primary',
                        loading: this.sending,
                        disabled: !this.formData.name
                    }, t('save'))
                ])
            ])
        ]);
    }

    private buildFormGroup(field: string, type: string, label: string) {
        return m('.Form-group', [
            m('label', label),
            m('input.FormControl', {
                type: type,
                value: this.formData[field] || '',
                oninput: (e: InputEvent) => {
                    const value = (e.target as HTMLInputElement).value;
                    this.formData[field] = type === 'number' ? parseInt(value, 10) : value;
                },
                disabled: this.sending
            })
        ]);
    }

    onsubmit(e: SubmitEvent) {
        e.preventDefault();
        this.sending = true;

        const isNew = !this.attrs.notificationType;
        const url = isNew
            ? `${app.forum.attribute('apiUrl')}/notification-types-create`
            : `${app.forum.attribute('apiUrl')}/notification-types/${this.attrs.notificationType?.id()}`;

        app.request({
            method: isNew ? 'POST' : 'PATCH',
            url: url,
            body: { data: { type: 'notification-types', attributes: this.formData, ...(isNew ? {} : { id: this.attrs.notificationType!.id() }) } },
        })
        .then((response: any) => {
            const typeModel = app.store.pushObject(response.data);
            this.attrs.onSave(typeModel);
            this.hide();
        })
        .catch(error => {
            this.sending = false;
            console.error("Error saving notification type:", error);
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

        return m('.NotificationTypesPage-content', [
            m('.header', [
                m('h1', app.translator.trans('huseyinfiliz-notificationhub.admin.title.page_title')),
                m('button.add-button', {
                    onclick: () => this.showAddModal()
                }, [
                    m('i.fas.fa-plus'),
                    ' ',
                    app.translator.trans('huseyinfiliz-notificationhub.admin.settings.add_button')
                ])
            ]),

            m('.separator'),

            m('.notification-list',
                this.notificationTypes && this.notificationTypes.length > 0 ? (
                    this.notificationTypes.map((type) =>
                        m('.notification-card', [
                            m('.status-indicator', { className: type.attribute('is_active') ? 'active' : 'inactive' }),
                            m('.notification-icon', [
                                m('i', { className: type.attribute('default_icon') || 'fas fa-bell' })
                            ]),
                            m('.notification-content', [
                                m('.notification-title', [
                                    m('span.notification-name', type.attribute('name')),
                                ]),
                                m('.notification-description', type.attribute('description')),
                            ]),
                            m('.notification-actions', [
                                m('button.action-button', {
                                    onclick: () => this.showEditModal(type)
                                }, m('i.fas.fa-edit')),
                                m('button.action-button.delete', {
                                    onclick: () => this.deleteNotificationType(type.id()!)
                                }, m('i.fas.fa-trash')),
                            ]),
                        ])
                    )
                ) : (
                    m('.NotificationTypesPage-empty', app.translator.trans('huseyinfiliz-notificationhub.admin.settings.no_data'))
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
                    item.id() === updatedType.id() ? updatedType : item
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
                url: `${app.forum.attribute('apiUrl')}/notification-types-delete/${id}`
            });

            this.notificationTypes = this.notificationTypes!.filter(type => type.id() !== id);
            m.redraw();
        } catch (e: any) {
            this.error = e.message || 'Failed to delete notification type';
            m.redraw();
        }
    }
}