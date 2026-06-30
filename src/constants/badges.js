// automatic: awarded by DB triggers (no admin action needed)
// adminOnly: awarded manually via admin Badge Management UI
// (no flag): awarded by monthly_reset()

export const BADGES = {
  // ── Automatic badges ────────────────────────────────────────
  clan: {
    key:         'clan',
    label:       'Clan Born',
    description: 'Earned your very first CP',
    icon:        '🔰',
    automatic:   true,
  },
  first: {
    key:         'first',
    label:       'First Step',
    description: 'Reached 50 CP in a month',
    icon:        '⭐',
    automatic:   true,
  },
  fast: {
    key:         'fast',
    label:       'Speed Runner',
    description: 'Reached 100 CP in a month',
    icon:        '🔥',
    automatic:   true,
  },
  perfect: {
    key:         'perfect',
    label:       'Perfect',
    description: 'Reached 150 CP in a month',
    icon:        '💯',
    automatic:   true,
  },
  competition: {
    key:         'competition',
    label:       'Competitor',
    description: 'Attended a competition this month',
    icon:        '🏆',
    automatic:   true,
  },
  champion: {
    key:         'champion',
    label:       'Champion',
    description: 'Won 1st place in a competition',
    icon:        '🥇',
    automatic:   true,
  },
  regular: {
    key:         'regular',
    label:       'Regular',
    description: 'Attended 5 events',
    icon:        '🎯',
    automatic:   true,
  },
  dedicated: {
    key:         'dedicated',
    label:       'Dedicated',
    description: 'Attended 20 events',
    icon:        '💎',
    automatic:   true,
  },
  event_machine: {
    key:         'event_machine',
    label:       'Event Machine',
    description: 'Attended 30 events',
    icon:        '⚡',
    automatic:   true,
  },

  // ── Admin-only badges ────────────────────────────────────────
  clan_legend: {
    key:       'clan_legend',
    label:     'Clan Legend',
    description: 'Legendary status within your clan',
    icon:      '🏅',
    adminOnly: true,
  },
  mvp: {
    key:       'mvp',
    label:     'MVP',
    description: 'Most Valuable Player in your clan',
    icon:      '🌟',
    adminOnly: true,
  },
  clan_warrior: {
    key:       'clan_warrior',
    label:     'Clan Warrior',
    description: 'Top contributor to clan total CP',
    icon:      '⚔️',
    adminOnly: true,
  },
  volunteer: {
    key:       'volunteer',
    label:     'Volunteer',
    description: 'Recognised for outstanding volunteer work',
    icon:      '❤️',
    adminOnly: true,
  },
  listener: {
    key:       'listener',
    label:     'Listener',
    description: 'Excellent listening skills',
    icon:      '👂',
    adminOnly: true,
  },
  reader: {
    key:       'reader',
    label:     'Reader',
    description: 'Excellent reading skills',
    icon:      '📖',
    adminOnly: true,
  },
  writer: {
    key:       'writer',
    label:     'Writer',
    description: 'Excellent writing skills',
    icon:      '✏️',
    adminOnly: true,
  },
  speaker: {
    key:       'speaker',
    label:     'Speaker',
    description: 'Excellent speaking skills',
    icon:      '🎤',
    adminOnly: true,
  },
  ielts: {
    key:       'ielts',
    label:     'IELTS Champion',
    description: 'Achieved an outstanding IELTS result',
    icon:      '🎓',
    adminOnly: true,
  },

  // ── Monthly reset badges ─────────────────────────────────────
  clan_champion: {
    key:         'clan_champion',
    label:       'Clan Champion',
    description: 'Member of the winning clan',
    icon:        '🛡️',
  },
  monthly_legend: {
    key:         'monthly_legend',
    label:       'Monthly Legend',
    description: '#1 overall student of the month',
    icon:        '👑',
  },
  fast_life_elite: {
    key:         'fast_life_elite',
    label:       'Fast Life Elite',
    description: 'Ranked top 5 overall in a month',
    icon:        '💎',
  },
}

export const LEVEL_THRESHOLDS = [
  { key: 'starter',    label: 'Starter',    min: 0   },
  { key: 'active',     label: 'Active',     min: 100 },
  { key: 'rising',     label: 'Rising',     min: 200 },
  { key: 'challenger', label: 'Challenger', min: 300 },
  { key: 'ambassador', label: 'Ambassador', min: 500 },
]
