import {
  Users, Award, Flame, CheckCircle, Trophy, Crown, Calendar, Star, Zap,
  Medal, Gem, Swords, Heart, Ear, BookOpen, PenLine, Mic, GraduationCap,
  Shield, BadgeCheck,
} from 'lucide-react'

// automatic: awarded by DB triggers (no admin action needed)
// adminOnly: awarded manually via admin Badge Management UI
// (no flag): awarded by monthly_reset()

export const BADGES = {
  // ── Automatic badges ────────────────────────────────────────
  clan: {
    key:       'clan',
    label:     'Clan Born',
    description: 'Earned your very first CP',
    automatic: true,
  },
  first: {
    key:       'first',
    label:     'First Step',
    description: 'Reached 50 CP in a month',
    automatic: true,
  },
  fast: {
    key:       'fast',
    label:     'Speed Runner',
    description: 'Reached 100 CP in a month',
    automatic: true,
  },
  perfect: {
    key:       'perfect',
    label:     'Perfect',
    description: 'Reached 150 CP in a month',
    automatic: true,
  },
  competition: {
    key:       'competition',
    label:     'Competitor',
    description: 'Attended a competition this month',
    automatic: true,
  },
  champion: {
    key:       'champion',
    label:     'Champion',
    description: 'Won 1st place in a competition',
    automatic: true,
  },
  regular: {
    key:       'regular',
    label:     'Regular',
    description: 'Attended 5 events',
    automatic: true,
  },
  dedicated: {
    key:       'dedicated',
    label:     'Dedicated',
    description: 'Attended 20 events',
    automatic: true,
  },
  event_machine: {
    key:       'event_machine',
    label:     'Event Machine',
    description: 'Attended 30 events',
    automatic: true,
  },

  // ── Admin-only badges ────────────────────────────────────────
  clan_legend: {
    key:       'clan_legend',
    label:     'Clan Legend',
    description: 'Legendary status within your clan',
    adminOnly: true,
  },
  mvp: {
    key:       'mvp',
    label:     'MVP',
    description: 'Most Valuable Player in your clan',
    adminOnly: true,
  },
  clan_warrior: {
    key:       'clan_warrior',
    label:     'Clan Warrior',
    description: 'Top contributor to clan total CP',
    adminOnly: true,
  },
  volunteer: {
    key:       'volunteer',
    label:     'Volunteer',
    description: 'Recognised for outstanding volunteer work',
    adminOnly: true,
  },
  listener: {
    key:       'listener',
    label:     'Listener',
    description: 'Excellent listening skills',
    adminOnly: true,
  },
  reader: {
    key:       'reader',
    label:     'Reader',
    description: 'Excellent reading skills',
    adminOnly: true,
  },
  writer: {
    key:       'writer',
    label:     'Writer',
    description: 'Excellent writing skills',
    adminOnly: true,
  },
  speaker: {
    key:       'speaker',
    label:     'Speaker',
    description: 'Excellent speaking skills',
    adminOnly: true,
  },
  ielts: {
    key:       'ielts',
    label:     'IELTS Champion',
    description: 'Achieved an outstanding IELTS result',
    adminOnly: true,
  },

  // ── Monthly reset badges ─────────────────────────────────────
  clan_champion: {
    key:         'clan_champion',
    label:       'Clan Champion',
    description: 'Member of the winning clan',
  },
  monthly_legend: {
    key:         'monthly_legend',
    label:       'Monthly Legend',
    description: '#1 overall student of the month',
  },
  fast_life_elite: {
    key:         'fast_life_elite',
    label:       'Fast Life Elite',
    description: 'Ranked top 5 overall in a month',
  },
}

// Central icon map — Lucide components, used by all badge-rendering UI
export const BADGE_ICONS = {
  // automatic
  clan:            Users,
  first:           Award,
  fast:            Flame,
  perfect:         CheckCircle,
  competition:     Trophy,
  champion:        Crown,
  regular:         Calendar,
  dedicated:       Star,
  event_machine:   Zap,
  // admin-only
  clan_legend:     Medal,
  mvp:             Gem,
  clan_warrior:    Swords,
  volunteer:       Heart,
  listener:        Ear,
  reader:          BookOpen,
  writer:          PenLine,
  speaker:         Mic,
  ielts:           GraduationCap,
  // monthly reset
  clan_champion:   Shield,
  monthly_legend:  Crown,
  fast_life_elite: BadgeCheck,
}

export const LEVEL_THRESHOLDS = [
  { key: 'starter',    label: 'Starter',    min: 0   },
  { key: 'active',     label: 'Active',     min: 100 },
  { key: 'rising',     label: 'Rising',     min: 200 },
  { key: 'challenger', label: 'Challenger', min: 300 },
  { key: 'ambassador', label: 'Ambassador', min: 500 },
]
