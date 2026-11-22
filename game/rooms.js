// Level data: three blueprint rooms, each with a patrolled hall, a camera gallery and a vent duct.
export const TOP = 72;
export const ROOM_W = 1280;
export const ROOM_H = 648;
const FLOOR_BOTTOM = 550;
const VENT = [16, 562, 1248, 70];

function verticalWall(x, doors) {
  const segs = [];
  let y = 16;
  for (const [a, b] of doors) {
    if (a > y) segs.push([x, y, 16, a - y]);
    y = b;
  }
  if (y < FLOOR_BOTTOM) segs.push([x, y, 16, FLOOR_BOTTOM - y]);
  return segs;
}

function buildShell(doorsA, doorsB) {
  return [
    [0, 0, 1280, 16], [0, 632, 1280, 16], [0, 0, 16, 648], [1264, 0, 16, 648],
    [90, 550, 1090, 12],
    ...verticalWall(420, doorsA),
    ...verticalWall(840, doorsB),
  ];
}

function demoRoute(loot, exit) {
  return [[52, 520], [52, 598], [1222, 598], [1222, 400], loot, [exit[0] + exit[2] / 2, exit[1] + exit[3] / 2]];
}

export const ROOMS = [
  {
    name: 'Marrowgate Gallery',
    walls: buildShell([[120, 200], [380, 460]], [[60, 140], [300, 380]]),
    obstacles: [[560, 180, 110, 36], [980, 250, 50, 120]],
    shadows: [[20, 440, 120, 105], [440, 420, 140, 120], [700, 20, 130, 100], [1060, 420, 190, 120]],
    vent: VENT,
    guards: [
      [[200, 470], [360, 470], [360, 110], [200, 110]],
      [[500, 300], [780, 300]],
    ],
    cams: [[640, 24, 90]],
    start: [60, 500],
    loot: [1150, 290],
    value: 8000,
    exit: [1172, 24, 84, 84],
  },
  {
    name: 'Copperline Bank',
    walls: buildShell([[120, 200], [380, 460]], [[60, 140], [300, 380]]),
    obstacles: [[560, 240, 90, 40], [980, 290, 40, 110]],
    shadows: [[20, 440, 120, 105], [440, 20, 120, 100], [690, 420, 140, 125], [860, 20, 130, 90], [1150, 420, 110, 125]],
    vent: VENT,
    guards: [
      [[180, 420], [340, 420], [340, 120], [180, 120]],
      [[500, 330], [800, 330], [800, 170], [500, 170]],
      [[920, 470], [1120, 470], [1120, 180], [920, 180]],
    ],
    cams: [[640, 24, 90], [1040, 24, 90]],
    start: [60, 500],
    loot: [1180, 300],
    value: 12000,
    exit: [1172, 24, 84, 84],
  },
  {
    name: 'Brasswick Vault',
    walls: buildShell([[60, 140], [420, 500]], [[200, 280], [440, 520]]),
    obstacles: [[580, 340, 80, 40], [1000, 260, 40, 100]],
    shadows: [[20, 440, 120, 105], [440, 20, 120, 90], [690, 330, 120, 80], [860, 420, 120, 125], [980, 20, 120, 90]],
    vent: VENT,
    guards: [
      [[180, 460], [340, 460], [340, 110], [180, 110]],
      [[490, 250], [790, 250]],
      [[790, 470], [490, 470]],
      [[930, 120], [1180, 120], [1180, 480], [930, 480]],
    ],
    cams: [[640, 24, 90], [1040, 24, 90], [1250, 320, 180]],
    start: [60, 500],
    loot: [1100, 300],
    value: 20000,
    exit: [1172, 24, 84, 84],
  },
];

for (const room of ROOMS) room.demo = demoRoute(room.loot, room.exit);
