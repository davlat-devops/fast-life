export const BADGES = {
  first_step: {
    key: 'first_step',
    label: 'First Step',
    description: 'Attended your first event',
    icon: '👣',
  },
  regular: {
    key: 'regular',
    label: 'Regular',
    description: 'Attended 5 events',
    icon: '🎯',
  },
  dedicated: {
    key: 'dedicated',
    label: 'Dedicated',
    description: 'Attended 15 events',
    icon: '⭐',
  },
  event_machine: {
    key: 'event_machine',
    label: 'Event Machine',
    description: 'Attended 30 events',
    icon: '🔥',
  },
  volunteer_heart: {
    key: 'volunteer_heart',
    label: 'Volunteer Heart',
    description: 'Completed your first volunteer activity',
    icon: '❤️',
  },
  super_volunteer: {
    key: 'super_volunteer',
    label: 'Super Volunteer',
    description: 'Completed 5 volunteer activities',
    icon: '💙',
  },
  competition_rookie: {
    key: 'competition_rookie',
    label: 'Competition Rookie',
    description: 'Participated in your first competition',
    icon: '🏆',
  },
  champion: {
    key: 'champion',
    label: 'Champion',
    description: 'Won 1st place in a competition',
    icon: '🥇',
  },
  clan_warrior: {
    key: 'clan_warrior',
    label: 'Clan Warrior',
    description: 'Top contributor to clan total CP',
    icon: '⚔️',
  },
  mvp: {
    key: 'mvp',
    label: 'MVP',
    description: 'Most Valuable Player in your clan',
    icon: '🌟',
  },
  perfect_month: {
    key: 'perfect_month',
    label: 'Perfect Month',
    description: 'Attended every event in a month',
    icon: '💯',
  },
  clan_legend: {
    key: 'clan_legend',
    label: 'Clan Legend',
    description: 'Legendary status within your clan',
    icon: '🏅',
  },
  fast_life_elite: {
    key: 'fast_life_elite',
    label: 'Fast Life Elite',
    description: 'Ranked top 5 overall in a month',
    icon: '💎',
  },
  monthly_legend: {
    key: 'monthly_legend',
    label: 'Monthly Legend',
    description: '#1 overall student of the month',
    icon: '👑',
  },
  clan_champion: {
    key: 'clan_champion',
    label: 'Clan Champion',
    description: 'Member of the winning clan',
    icon: '🏆',
  },
}

export const LEVEL_THRESHOLDS = [
  { key: 'starter', label: 'Starter', min: 0 },
  { key: 'active', label: 'Active', min: 100 },
  { key: 'rising', label: 'Rising', min: 200 },
  { key: 'challenger', label: 'Challenger', min: 300 },
  { key: 'ambassador', label: 'Ambassador', min: 500 },
]

export const getLevelForCP = (cp) => {
  const sorted = [...LEVEL_THRESHOLDS].sort((a, b) => b.min - a.min)
  return sorted.find((l) => cp >= l.min) || LEVEL_THRESHOLDS[0]
}
