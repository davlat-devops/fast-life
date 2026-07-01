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
    description: 'Receive CP for the first time',
    automatic: true,
  },
  first: {
    key:       'first',
    label:     'First Step',
    description: 'Reach 50 CP in a month',
    automatic: true,
  },
  fast: {
    key:       'fast',
    label:     'Speed Runner',
    description: 'Reach 100 CP in a month',
    automatic: true,
  },
  perfect: {
    key:       'perfect',
    label:     'Perfect',
    description: 'Reach 150 CP in a month',
    automatic: true,
  },
  competition: {
    key:       'competition',
    label:     'Competitor',
    description: 'Participate in the first competition of the month',
    automatic: true,
  },
  champion: {
    key:       'champion',
    label:     'Champion',
    description: 'Win 1st place in a competition',
    automatic: true,
  },
  regular: {
    key:       'regular',
    label:     'Regular',
    description: 'Attend 5 events total',
    automatic: true,
  },
  dedicated: {
    key:       'dedicated',
    label:     'Dedicated',
    description: 'Attend 20 events total',
    automatic: true,
  },
  event_machine: {
    key:       'event_machine',
    label:     'Event Machine',
    description: 'Attend 30 events total',
    automatic: true,
  },

  // ── Admin-only badges ────────────────────────────────────────
  clan_legend: {
    key:       'clan_legend',
    label:     'Clan Legend',
    description: 'Awarded by admin for outstanding clan contribution',
    adminOnly: true,
  },
  mvp: {
    key:       'mvp',
    label:     'MVP',
    description: 'Awarded by admin for outstanding individual performance',
    adminOnly: true,
  },
  clan_warrior: {
    key:       'clan_warrior',
    label:     'Clan Warrior',
    description: 'Awarded by admin',
    adminOnly: true,
  },
  volunteer: {
    key:       'volunteer',
    label:     'Volunteer',
    description: 'Awarded by admin for volunteering',
    adminOnly: true,
  },
  listener: {
    key:       'listener',
    label:     'Listener',
    description: 'Score 8+ in IELTS Listening mock exam',
    adminOnly: true,
  },
  reader: {
    key:       'reader',
    label:     'Reader',
    description: 'Score 8+ in IELTS Reading mock exam',
    adminOnly: true,
  },
  writer: {
    key:       'writer',
    label:     'Writer',
    description: 'Score 7+ in IELTS Writing mock exam',
    adminOnly: true,
  },
  speaker: {
    key:       'speaker',
    label:     'Speaker',
    description: 'Score 7+ in IELTS Speaking mock exam',
    adminOnly: true,
  },
  ielts: {
    key:       'ielts',
    label:     'IELTS Champion',
    description: 'Achieve 8.0 overall in IELTS mock exam',
    adminOnly: true,
  },

  // ── Monthly reset badges ─────────────────────────────────────
  clan_champion: {
    key:         'clan_champion',
    label:       'Clan Champion',
    description: 'Member of the winning clan',
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
  fast_life_elite: BadgeCheck,
}

export const LEVEL_THRESHOLDS = [
  { key: 'starter',    label: 'Starter',    min: 0   },
  { key: 'active',     label: 'Active',     min: 100 },
  { key: 'rising',     label: 'Rising',     min: 200 },
  { key: 'challenger', label: 'Challenger', min: 300 },
  { key: 'ambassador', label: 'Ambassador', min: 500 },
]
