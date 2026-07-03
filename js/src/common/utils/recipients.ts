import app from 'flarum/common/app';
import Group from 'flarum/common/models/Group';
import User from 'flarum/common/models/User';

export type Recipient = Group | User;

export interface ParsedRecipientRef {
  kind: 'user' | 'group';
  id: string;
}

/**
 * Parses the "user:1,group:2" storage format into a plain, synchronous list
 * of { kind, id } references. Does not touch the store — safe to call
 * before any async lookups.
 */
export function parseRecipients(raw: string | null | undefined): ParsedRecipientRef[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [kind, id] = item.split(':').map((part) => part.trim());
      return { kind: kind as 'user' | 'group', id };
    })
    .filter((ref) => (ref.kind === 'user' || ref.kind === 'group') && !!ref.id);
}

/**
 * Serializes a list of Group/User models back into the "user:1,group:2" format.
 */
export function serializeRecipients(recipients: Recipient[]): string | null {
  const serialized = recipients
    .map((recipient) => {
      const kind = recipient.data.type === 'users' ? 'user' : 'group';
      return `${kind}:${recipient.id()}`;
    })
    .join(',');

  return serialized || null;
}

/**
 * Resolves parsed recipient refs into actual Group/User models.
 *
 * Groups are resolved synchronously from the store (already loaded on boot).
 * Users are resolved asynchronously via app.store.find.
 *
 * `isStale` is checked before every state mutation so callers can cancel
 * in-flight resolutions when the underlying selection changes (e.g. the
 * user switches notification type before the previous lookup finishes).
 *
 * `onEach` is called once per resolved recipient, `onDone` once all refs
 * (found or not) have settled.
 */
export function resolveRecipients(
  refs: ParsedRecipientRef[],
  onEach: (recipient: Recipient) => void,
  onDone: () => void,
  isStale: () => boolean
): void {
  if (refs.length === 0) {
    onDone();
    return;
  }

  let remaining = refs.length;

  const settle = () => {
    remaining -= 1;
    if (remaining === 0 && !isStale()) {
      onDone();
    }
  };

  refs.forEach((ref) => {
    if (ref.kind === 'group') {
      const group = app.store.getById<Group>('groups', ref.id);
      if (group && !isStale()) {
        onEach(group);
      }
      settle();
    } else {
      app.store
        .find<User>('users', ref.id)
        .then((user) => {
          if (user && !isStale()) {
            onEach(user as unknown as User);
          }
        })
        .catch(() => {
          // Deleted/unknown user referenced by a stored default — ignore silently.
        })
        .finally(() => {
          settle();
        });
    }
  });
}
