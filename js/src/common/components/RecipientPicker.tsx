import app from 'flarum/common/app';
import Component, { ComponentAttrs } from 'flarum/common/Component';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import KeyboardNavigatable from 'flarum/common/utils/KeyboardNavigatable';
import username from 'flarum/common/helpers/username';
import icon from 'flarum/common/helpers/icon';
import Group from 'flarum/common/models/Group';
import User from 'flarum/common/models/User';
import { getContrastTextColor } from '../utils/color';

type Recipient = Group | User;

export interface RecipientPickerAttrs extends ComponentAttrs {
  recipients: Recipient[];
  onChange: (recipients: Recipient[]) => void;
  searchGroups?: boolean;
  searchUsers?: boolean;
  disabled?: boolean;
  placeholder?: string;
  translationPrefix: string; // e.g. 'huseyinfiliz-notificationhub.forum' or '...admin'
}

/**
 * Reusable tag-style recipient picker: search-as-you-type over users and/or
 * groups, chip display of current selection, keyboard navigation.
 *
 * Data ownership stays with the parent (`recipients` / `onChange`); this
 * component only owns its own search UI state.
 */
export default class RecipientPicker extends Component<RecipientPickerAttrs> {
  private filter: string = '';
  private focused: boolean = false;
  private loadingResults: boolean = false;
  private searchResults: Recipient[] = [];
  private searchIndex: number = 0;
  private searchTimeout: number = -1;
  private lastApiResults: User[] = [];
  private navigator: KeyboardNavigatable = new KeyboardNavigatable();

  oninit(vnode: any) {
    super.oninit(vnode);

    this.navigator
      .when((event) => event.key !== 'Tab' || !!this.filter)
      .onUp(() => {
        if (this.searchIndex > 0) {
          this.searchIndex--;
          m.redraw();
        }
      })
      .onDown(() => {
        if (this.searchIndex < this.searchResults.length - 1) {
          this.searchIndex++;
          m.redraw();
        }
      })
      .onSelect(() => this.selectResult(this.searchResults[this.searchIndex]))
      .onRemove(() => {
        const recipients = this.attrs.recipients.slice(0, -1);
        this.attrs.onChange(recipients);
        m.redraw();
      });
  }

  private get searchUsers(): boolean {
    return this.attrs.searchUsers !== false;
  }

  private get searchGroups(): boolean {
    return this.attrs.searchGroups !== false;
  }

  /** translationPrefix is expected to be e.g. 'huseyinfiliz-notificationhub.forum' */
  private t(subKey: string, params?: Record<string, unknown>) {
    return app.translator.trans(`${this.attrs.translationPrefix}.${subKey}`, params);
  }

  recipientLabel(recipient: Recipient) {
    if (recipient.data.type === 'users') {
      return <span className="RecipientLabel">{username(recipient as User)}</span>;
    }

    if (recipient.data.type === 'groups') {
      const group = recipient as Group;
      const textColor = getContrastTextColor(group.color());
      return (
        <span
          className={'RecipientLabel' + (group.color() ? ' colored' : '')}
          style={group.color() ? { backgroundColor: group.color(), color: textColor || undefined } : {}}
        >
          {group.icon() ? [icon(group.icon()!), ' '] : null}
          {group.namePlural()}
        </span>
      );
    }

    return '[unknown]';
  }

  searchResultKind(recipient: Recipient) {
    if (recipient.data.type === 'users') {
      return this.t('recipient_kinds.user');
    }
    if (recipient.data.type === 'groups') {
      return this.t('recipient_kinds.group');
    }
    return '[unknown]';
  }

  selectResult(result: Recipient | null) {
    if (!result) {
      return;
    }

    this.attrs.onChange([...this.attrs.recipients, result]);
    this.filter = '';
    this.searchResults = [];
    m.redraw();
  }

  removeRecipient(index: number) {
    const recipients = this.attrs.recipients.slice();
    recipients.splice(index, 1);
    this.attrs.onChange(recipients);
    m.redraw();
  }

  performNewSearch() {
    this.searchIndex = 0;
    const query = this.filter.toLowerCase();

    this.buildSearchResults(query);

    clearTimeout(this.searchTimeout);

    if (query.length >= 3 && this.searchUsers) {
      this.searchTimeout = window.setTimeout(() => {
        this.loadingResults = true;
        m.redraw();

        app.store
          .find<User[]>('users', {
            filter: { q: query },
            page: { limit: 5 },
          })
          .then((results) => {
            this.loadingResults = false;
            this.lastApiResults = (results as unknown as User[]) || [];
            this.buildSearchResults(query);
            m.redraw();
          });
      }, 250);
    }
  }

  buildSearchResults(query: string) {
    if (!query) {
      this.searchResults = [];
      return;
    }

    const results: Recipient[] = [];

    if (this.searchGroups) {
      app.store.all<Group>('groups').forEach((group) => {
        if (group.id() === Group.GUEST_ID) {
          return;
        }
        if (group.nameSingular().toLowerCase().indexOf(query) !== -1 || group.namePlural().toLowerCase().indexOf(query) !== -1) {
          results.push(group);
        }
      });
    }

    if (this.searchUsers) {
      this.lastApiResults.forEach((user) => {
        if (user.username().toLowerCase().indexOf(query) !== -1) {
          results.push(user);
        }
      });
    }

    this.searchResults = results.filter((result) => {
      return !this.attrs.recipients.some((recipient) => recipient.data.type === result.data.type && recipient.id() === result.id());
    });

    m.redraw();
  }

  view() {
    const disabled = !!this.attrs.disabled;

    return (
      <div className={'RecipientPicker RecipientsInput FormControl' + (this.focused ? ' focus' : '')}>
        <span className="RecipientsInput-selected">
          {this.attrs.recipients.map((recipient, index) => (
            <span
              className="RecipientsInput-recipient"
              onclick={() => !disabled && this.removeRecipient(index)}
              title={this.searchResultKind(recipient)}
            >
              {this.recipientLabel(recipient)}
            </span>
          ))}
        </span>
        <input
          className="FormControl"
          placeholder={this.attrs.placeholder || this.t('modal_notification.recipients_placeholder')}
          value={this.filter}
          disabled={disabled}
          oninput={(event: InputEvent) => {
            this.filter = (event.target as HTMLInputElement).value;
            this.performNewSearch();
          }}
          onkeydown={this.navigator.navigate.bind(this.navigator)}
          onfocus={() => {
            this.focused = true;
          }}
          onblur={() => {
            this.focused = false;
          }}
        />
        {this.loadingResults ? LoadingIndicator.component({ size: 'small' }) : null}
        {this.searchResults.length
          ? m(
              'ul.Dropdown-menu.search-dropdown',
              this.searchResults.map((result, index) =>
                m(
                  'li',
                  {
                    className: this.searchIndex === index ? 'active' : '',
                    onmousedown: (e: MouseEvent) => {
                      e.preventDefault();
                      this.selectResult(result);
                    },
                  },
                  m('button[type=button]', [m('span.SearchResultKind', this.searchResultKind(result)), this.recipientLabel(result)])
                )
              )
            )
          : null}
      </div>
    );
  }
}
