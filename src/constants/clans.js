export const CLANS = {
  VIPERON: {
    id: 'VIPERON',
    name: 'Viperon',
    mascot: 'snake',
    colorBg: '#8B7355',
    colorAccent: '#4A7C3F',
    emoji: '🐍',
  },
  CRODON: {
    id: 'CRODON',
    name: 'Crodon',
    mascot: 'dragon',
    colorBg: '#0D0D0D',
    colorAccent: '#A0A0A0',
    emoji: '🐉',
  },
  AVERON: {
    id: 'AVERON',
    name: 'Averon',
    mascot: 'eagle',
    colorBg: '#0A1628',
    colorAccent: '#C9A227',
    emoji: '🦅',
  },
  WOLFRIN: {
    id: 'WOLFRIN',
    name: 'Wolfrin',
    mascot: 'wolf',
    colorBg: '#8B0000',
    colorAccent: '#C0C0C0',
    emoji: '🐺',
  },
}

export const CLAN_NAMES = Object.keys(CLANS)

export const getRandomClan = () =>
  CLAN_NAMES[Math.floor(Math.random() * CLAN_NAMES.length)]
