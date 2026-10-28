/**
 * Programmer-flavoured, language-neutral material for Code Memory. Pure data: generators decide
 * how much of it to show and how similar the chosen items are.
 */

// ── Record fields ─────────────────────────────────────────────────────────────────────────────────

export type Domain =
  /** Three-digit identifier. */
  | { readonly type: 'id' }
  | { readonly type: 'name' }
  | { readonly type: 'enum'; readonly values: readonly string[] }
  | { readonly type: 'int'; readonly min: number; readonly max: number; readonly step: number }
  /** Display-only: two values are too few for a fair question. */
  | { readonly type: 'bool' };

export interface FieldSpec {
  readonly name: string;
  readonly domain: Domain;
}

export interface EntitySchema {
  readonly type: string;
  /** `id` first; every schema has six fields so any level's fieldCount fits. */
  readonly fields: readonly FieldSpec[];
}

const id: FieldSpec = { name: 'id', domain: { type: 'id' } };
const name = (fieldName: string): FieldSpec => ({ name: fieldName, domain: { type: 'name' } });
const choice = (fieldName: string, values: readonly string[]): FieldSpec => ({
  name: fieldName,
  domain: { type: 'enum', values },
});
const int = (fieldName: string, min: number, max: number, step = 1): FieldSpec => ({
  name: fieldName,
  domain: { type: 'int', min, max, step },
});
const flag = (fieldName: string): FieldSpec => ({ name: fieldName, domain: { type: 'bool' } });

export const SCHEMAS: readonly EntitySchema[] = [
  {
    type: 'User',
    fields: [
      id,
      name('name'),
      choice('role', ['ADMIN', 'EDITOR', 'VIEWER', 'AUDITOR', 'OWNER', 'GUEST']),
      choice('region', ['EU', 'US', 'APAC', 'LATAM', 'MEA', 'ANZ']),
      flag('active'),
      int('logins', 2, 98),
    ],
  },
  {
    type: 'Order',
    fields: [
      id,
      choice('status', ['PENDING', 'PAID', 'SHIPPED', 'REFUNDED', 'CANCELLED', 'ON_HOLD']),
      int('total', 15, 985, 5),
      choice('currency', ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD']),
      int('items', 1, 12),
      flag('gift'),
    ],
  },
  {
    type: 'Session',
    fields: [
      id,
      name('owner'),
      choice('device', ['WEB', 'IOS', 'ANDROID', 'CLI', 'TV', 'WATCH']),
      int('ttl', 5, 120, 5),
      flag('secure'),
      choice('scope', ['READ', 'WRITE', 'ADMIN', 'BILLING', 'AUDIT', 'SUPPORT']),
    ],
  },
  {
    type: 'Build',
    fields: [
      id,
      choice('branch', ['main', 'develop', 'release', 'hotfix', 'staging', 'preview']),
      choice('status', ['QUEUED', 'RUNNING', 'PASSED', 'FAILED', 'SKIPPED', 'CANCELLED']),
      int('retries', 0, 9),
      flag('cached'),
      name('author'),
    ],
  },
  {
    type: 'Server',
    fields: [
      id,
      choice('status', ['UP', 'DOWN', 'DEGRADED', 'DRAINING', 'BOOTING', 'STANDBY']),
      choice('port', ['80', '443', '3000', '5432', '6379', '8080', '9000']),
      int('cpu', 5, 95),
      choice('zone', ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']),
      flag('primary'),
    ],
  },
  {
    type: 'Ticket',
    fields: [
      id,
      choice('priority', ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'BLOCKER', 'TRIVIAL']),
      name('assignee'),
      choice('points', ['1', '2', '3', '5', '8', '13']),
      flag('open'),
      choice('label', ['BUG', 'FEATURE', 'CHORE', 'DOCS', 'SPIKE', 'INFRA']),
    ],
  },
];

/** Parent → child relations for joins: the child stores the parent's id in `foreignKey`. */
export const RELATIONS: readonly {
  readonly parent: string;
  readonly child: string;
  readonly foreignKey: string;
}[] = [
  { parent: 'User', child: 'Order', foreignKey: 'userId' },
  { parent: 'Server', child: 'Build', foreignKey: 'serverId' },
  { parent: 'User', child: 'Ticket', foreignKey: 'reporterId' },
];

/** Families of look-alike names; "high similarity" draws every name from one family. */
export const NAME_FAMILIES: readonly (readonly string[])[] = [
  ['Ana', 'Ada', 'Ava', 'Alma', 'Anya', 'Aida'],
  ['Mara', 'Maria', 'Marta', 'Mira', 'Myra', 'Mia'],
  ['Leo', 'Leon', 'Lea', 'Levi', 'Lev', 'Lia'],
  ['Tom', 'Tim', 'Tam', 'Toma', 'Timo', 'Tomas'],
  ['Kai', 'Kaia', 'Kira', 'Kit', 'Kim', 'Kian'],
  ['Noa', 'Nora', 'Nia', 'Nico', 'Nils', 'Nina'],
];

// ── Calls ─────────────────────────────────────────────────────────────────────────────────────────

export const RESOURCES: readonly { readonly name: string; readonly sub: string }[] = [
  { name: 'users', sub: 'roles' },
  { name: 'orders', sub: 'items' },
  { name: 'products', sub: 'reviews' },
  { name: 'invoices', sub: 'lines' },
  { name: 'sessions', sub: 'events' },
  { name: 'payments', sub: 'refunds' },
  { name: 'reports', sub: 'exports' },
  { name: 'tokens', sub: 'scopes' },
  { name: 'carts', sub: 'items' },
  { name: 'files', sub: 'versions' },
];

/** Every sensible call on a resource: collection, item and sub-collection, with their methods. */
export function callsOn(resource: { readonly name: string; readonly sub: string }): string[] {
  const collection = `/${resource.name}`;
  const item = `${collection}/{id}`;
  const sub = `${item}/${resource.sub}`;
  return [
    `GET ${collection}`,
    `POST ${collection}`,
    `GET ${item}`,
    `PUT ${item}`,
    `PATCH ${item}`,
    `DELETE ${item}`,
    `GET ${sub}`,
    `POST ${sub}`,
  ];
}

// ── Grid keywords ─────────────────────────────────────────────────────────────────────────────────

/** Families of look-alike keywords. Every word is unique across families. */
export const KEYWORD_FAMILIES: readonly (readonly string[])[] = [
  ['get', 'set', 'put', 'let'],
  ['map', 'max', 'min', 'mod'],
  ['pop', 'top', 'push', 'peek'],
  ['node', 'code', 'mode', 'core'],
  ['sort', 'port', 'fork', 'lock'],
  ['list', 'last', 'lint', 'link'],
  ['heap', 'head', 'hash', 'hook'],
  ['tree', 'true', 'trie', 'type'],
  ['null', 'nil', 'none', 'void'],
  ['init', 'int', 'iter', 'item'],
  ['loop', 'load', 'log', 'lib'],
  ['byte', 'bit', 'bool', 'buf'],
  ['try', 'trace', 'test', 'task'],
  ['queue', 'query', 'quota', 'quit'],
  ['sync', 'sink', 'send', 'seed'],
  ['char', 'chan', 'chain', 'cache'],
  ['read', 'real', 'ref', 'reset'],
  ['edge', 'enum', 'emit', 'exit'],
  ['diff', 'dict', 'disk', 'dump'],
  ['file', 'fill', 'find', 'flag'],
];

// ── Variables ─────────────────────────────────────────────────────────────────────────────────────

export const VARIABLES = ['x', 'y', 'z', 'w'] as const;
