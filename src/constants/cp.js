export const CP_RULES = {
  STANDARD_EVENT: 20,
  IELTS_MOCK: 30,
  VOLUNTEER: 50,
  COMPETITION_1ST: 120,
  COMPETITION_2ND: 80,
  COMPETITION_3RD: 50,
  REFERRAL: 30,
  PEER_SPOTLIGHT: 25,
  PERFECT_MONTH: 100,
  WINNING_CLAN_HEADSTART: 50,
  END_OF_MONTH_1ST: 125,
  END_OF_MONTH_TOP5: 75,
  END_OF_MONTH_TOP5_PER_CLAN: 30,
}

export const MANUAL_CP_REASONS = [
  { value: 'volunteer', label: 'Volunteer', cp: CP_RULES.VOLUNTEER },
  { value: 'competition_1st', label: '1st Place – Competition', cp: CP_RULES.COMPETITION_1ST },
  { value: 'competition_2nd', label: '2nd Place – Competition', cp: CP_RULES.COMPETITION_2ND },
  { value: 'competition_3rd', label: '3rd Place – Competition', cp: CP_RULES.COMPETITION_3RD },
  { value: 'referral', label: 'Referral', cp: CP_RULES.REFERRAL },
  { value: 'peer_spotlight', label: 'Peer Spotlight', cp: CP_RULES.PEER_SPOTLIGHT },
  { value: 'other', label: 'Other (specify in note)', cp: null },
]

export const EVENT_CATEGORIES = [
  'English',
  'IELTS',
  'Competition',
  'Volunteer',
  'Korean',
  'Russian',
  'Math',
]

export const CP_FOR_CATEGORY = {
  IELTS: CP_RULES.IELTS_MOCK,
}
export const DEFAULT_EVENT_CP = CP_RULES.STANDARD_EVENT
