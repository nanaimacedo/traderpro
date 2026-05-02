import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Data extracted from PDF reports - daily consolidated results
// Each entry represents a day's trading summary
const dailyData = [
  // ===== FEVEREIRO 2026 =====
  // 02/02 - R$ 50,00
  { date: "2026-02-02", results: [
    { time: "09:11", dir: "COMPRA", entry: 182515, exit: 182510, contracts: 3, fin: -3 },
    { time: "09:51", dir: "COMPRA", entry: 183030, exit: 183030, contracts: 1, fin: 0 },
    { time: "10:58", dir: "COMPRA", entry: 183810, exit: 183725, contracts: 3, fin: -51 },
    { time: "11:00", dir: "COMPRA", entry: 183800, exit: 183800, contracts: 1, fin: 0 },
    { time: "11:11", dir: "COMPRA", entry: 183705, exit: 183385, contracts: 3, fin: -192 },
    { time: "11:31", dir: "COMPRA", entry: 182850, exit: 183085, contracts: 3, fin: 141 },
    { time: "11:35", dir: "COMPRA", entry: 183180, exit: 183245, contracts: 3, fin: 39 },
    { time: "12:07", dir: "COMPRA", entry: 182740, exit: 182933, contracts: 3, fin: 116 },
  ]},
  // 03/02 - R$ 187,00
  { date: "2026-02-03", results: [
    { time: "09:01", dir: "COMPRA", entry: 185195, exit: 185205, contracts: 1, fin: 6 },
    { time: "09:15", dir: "COMPRA", entry: 185230, exit: 185288, contracts: 3, fin: 35 },
    { time: "09:20", dir: "COMPRA", entry: 185680, exit: 185813, contracts: 3, fin: 80 },
    { time: "10:10", dir: "COMPRA", entry: 186180, exit: 186190, contracts: 1, fin: 6 },
    { time: "10:34", dir: "COMPRA", entry: 186150, exit: 186155, contracts: 1, fin: 3 },
    { time: "10:53", dir: "COMPRA", entry: 186675, exit: 186685, contracts: 1, fin: 6 },
    { time: "10:55", dir: "COMPRA", entry: 186845, exit: 186855, contracts: 1, fin: 6 },
    { time: "10:58", dir: "COMPRA", entry: 186965, exit: 187040, contracts: 1, fin: 45 },
  ]},
  // 04/02 - -R$ 202,00
  { date: "2026-02-04", results: [
    { time: "10:07", dir: "COMPRA", entry: 185380, exit: 185385, contracts: 1, fin: 3 },
    { time: "10:08", dir: "COMPRA", entry: 185435, exit: 185225, contracts: 3, fin: -126 },
    { time: "10:38", dir: "COMPRA", entry: 185230, exit: 185008, contracts: 3, fin: -133 },
    { time: "10:59", dir: "VENDA", entry: 184715, exit: 184673, contracts: 1, fin: 25 },
    { time: "11:09", dir: "COMPRA", entry: 184560, exit: 184598, contracts: 3, fin: 23 },
    { time: "11:21", dir: "VENDA", entry: 184435, exit: 184440, contracts: 1, fin: 3 },
    { time: "11:23", dir: "VENDA", entry: 184195, exit: 184205, contracts: 1, fin: 6 },
    { time: "11:23", dir: "VENDA", entry: 184100, exit: 184095, contracts: 1, fin: -3 },
  ]},
  // 05/02 - -R$ 76,00
  { date: "2026-02-05", results: [
    { time: "09:26", dir: "COMPRA", entry: 182760, exit: 182813, contracts: 3, fin: 32 },
    { time: "10:09", dir: "COMPRA", entry: 182900, exit: 182905, contracts: 1, fin: 3 },
    { time: "10:24", dir: "COMPRA", entry: 183585, exit: 183618, contracts: 3, fin: 20 },
    { time: "10:32", dir: "COMPRA", entry: 183465, exit: 183230, contracts: 3, fin: -141 },
    { time: "10:37", dir: "COMPRA", entry: 183440, exit: 183476, contracts: 3, fin: 22 },
    { time: "11:06", dir: "COMPRA", entry: 183605, exit: 183631, contracts: 3, fin: 21 },
    { time: "11:10", dir: "VENDA", entry: 183685, exit: 183410, contracts: 1, fin: -110 },
    { time: "11:16", dir: "COMPRA", entry: 183645, exit: 183840, contracts: 1, fin: 117 },
    { time: "11:24", dir: "COMPRA", entry: 184015, exit: 184070, contracts: 1, fin: 33 },
    { time: "11:42", dir: "COMPRA", entry: 184400, exit: 184583, contracts: 3, fin: 110 },
    { time: "11:47", dir: "COMPRA", entry: 184845, exit: 184540, contracts: 1, fin: -183 },
  ]},
  // 06/02 - R$ 55,00
  { date: "2026-02-06", results: [
    { time: "09:32", dir: "COMPRA", entry: 183085, exit: 183160, contracts: 3, fin: 45 },
    { time: "09:35", dir: "COMPRA", entry: 183155, exit: 183203, contracts: 3, fin: 29 },
    { time: "09:44", dir: "COMPRA", entry: 183045, exit: 182805, contracts: 3, fin: -144 },
    { time: "09:56", dir: "COMPRA", entry: 183090, exit: 182590, contracts: 1, fin: -300 },
    { time: "10:20", dir: "COMPRA", entry: 182865, exit: 182900, contracts: 3, fin: 28 },
    { time: "10:44", dir: "COMPRA", entry: 182615, exit: 182868, contracts: 3, fin: 203 },
    { time: "11:27", dir: "COMPRA", entry: 183185, exit: 183211, contracts: 3, fin: 21 },
    { time: "11:30", dir: "COMPRA", entry: 183180, exit: 183242, contracts: 3, fin: 50 },
    { time: "12:10", dir: "COMPRA", entry: 182410, exit: 182506, contracts: 3, fin: 58 },
    { time: "12:19", dir: "COMPRA", entry: 182680, exit: 182730, contracts: 1, fin: 20 },
    { time: "13:05", dir: "COMPRA", entry: 182705, exit: 182791, contracts: 3, fin: 52 },
  ]},
  // 09/02 - R$ 107,00
  { date: "2026-02-09", results: [
    { time: "09:36", dir: "COMPRA", entry: 184515, exit: 184846, contracts: 3, fin: 199 },
    { time: "11:46", dir: "COMPRA", entry: 185040, exit: 184880, contracts: 1, fin: -96 },
    { time: "12:06", dir: "COMPRA", entry: 184695, exit: 184700, contracts: 1, fin: 4 },
  ]},
  // 10/02 - R$ 72,00
  { date: "2026-02-10", results: [
    { time: "09:43", dir: "COMPRA", entry: 186260, exit: 186135, contracts: 1, fin: -25 },
    { time: "09:55", dir: "COMPRA", entry: 186135, exit: 186140, contracts: 1, fin: 3 },
    { time: "11:16", dir: "COMPRA", entry: 186300, exit: 186423, contracts: 3, fin: 74 },
    { time: "11:44", dir: "COMPRA", entry: 186330, exit: 186095, contracts: 1, fin: -141 },
    { time: "11:58", dir: "COMPRA", entry: 186495, exit: 186758, contracts: 3, fin: 158 },
    { time: "12:28", dir: "COMPRA", entry: 187235, exit: 187240, contracts: 1, fin: 3 },
  ]},
  // 11/02 - -R$ 90,00
  { date: "2026-02-11", results: [
    { time: "09:01", dir: "COMPRA", entry: 187445, exit: 187775, contracts: 1, fin: 198 },
    { time: "09:48", dir: "COMPRA", entry: 188615, exit: 187955, contracts: 1, fin: -396 },
    { time: "10:11", dir: "COMPRA", entry: 188156, exit: 188170, contracts: 3, fin: 11 },
    { time: "10:23", dir: "COMPRA", entry: 188320, exit: 188405, contracts: 1, fin: 68 },
    { time: "10:29", dir: "COMPRA", entry: 188465, exit: 188425, contracts: 1, fin: -32 },
    { time: "10:37", dir: "COMPRA", entry: 188415, exit: 188443, contracts: 3, fin: 23 },
    { time: "10:40", dir: "COMPRA", entry: 188335, exit: 188382, contracts: 3, fin: 38 },
  ]},
  // 12/02 - R$ 151,00
  { date: "2026-02-12", results: [
    { time: "09:03", dir: "VENDA", entry: 189665, exit: 189670, contracts: 1, fin: 3 },
    { time: "10:03", dir: "COMPRA", entry: 189200, exit: 189428, contracts: 3, fin: 137 },
    { time: "12:12", dir: "COMPRA", entry: 190140, exit: 190167, contracts: 3, fin: 11 },
  ]},
  // 13/02 - R$ 61,00
  { date: "2026-02-13", results: [
    { time: "10:50", dir: "COMPRA", entry: 185550, exit: 184645, contracts: 3, fin: -543 },
    { time: "11:36", dir: "VENDA", entry: 184230, exit: 183881, contracts: 3, fin: 209 },
    { time: "11:43", dir: "COMPRA", entry: 184110, exit: 184498, contracts: 3, fin: 233 },
    { time: "11:46", dir: "COMPRA", entry: 184900, exit: 184943, contracts: 3, fin: 26 },
    { time: "11:53", dir: "COMPRA", entry: 184545, exit: 184330, contracts: 1, fin: -129 },
    { time: "12:08", dir: "COMPRA", entry: 184475, exit: 184595, contracts: 1, fin: 96 },
    { time: "12:09", dir: "COMPRA", entry: 184710, exit: 184595, contracts: 1, fin: -46 },
    { time: "12:11", dir: "COMPRA", entry: 184650, exit: 184913, contracts: 3, fin: 211 },
  ]},
  // 18/02 - -R$ 521,00
  { date: "2026-02-18", results: [
    { time: "14:54", dir: "COMPRA", entry: 186790, exit: 186785, contracts: 1, fin: -2 },
    { time: "15:15", dir: "COMPRA", entry: 185790, exit: 185776, contracts: 3, fin: -8 },
    { time: "15:27", dir: "COMPRA", entry: 185790, exit: 185828, contracts: 3, fin: 23 },
    { time: "15:42", dir: "COMPRA", entry: 185828, exit: 185535, contracts: 3, fin: -176 },
    { time: "16:00", dir: "COMPRA", entry: 185738, exit: 185758, contracts: 3, fin: 16 },
    { time: "16:02", dir: "COMPRA", entry: 185767, exit: 185415, contracts: 1, fin: -282 },
    { time: "16:50", dir: "VENDA", entry: 185430, exit: 185320, contracts: 1, fin: -88 },
  ]},
  // 19/02 - R$ 109,00
  { date: "2026-02-19", results: [
    { time: "11:55", dir: "COMPRA", entry: 190350, exit: 190433, contracts: 3, fin: 50 },
    { time: "12:04", dir: "COMPRA", entry: 191270, exit: 191275, contracts: 1, fin: 3 },
    { time: "12:04", dir: "COMPRA", entry: 191265, exit: 191290, contracts: 1, fin: 15 },
    { time: "12:06", dir: "COMPRA", entry: 191275, exit: 191045, contracts: 1, fin: -138 },
    { time: "12:08", dir: "COMPRA", entry: 191220, exit: 191466, contracts: 3, fin: 148 },
    { time: "12:36", dir: "COMPRA", entry: 191970, exit: 191998, contracts: 3, fin: 17 },
  ]},
  // 20/02 - R$ 136,00
  { date: "2026-02-20", results: [
    { time: "09:59", dir: "COMPRA", entry: 190740, exit: 190745, contracts: 1, fin: 3 },
    { time: "10:08", dir: "COMPRA", entry: 190810, exit: 190848, contracts: 3, fin: 23 },
    { time: "11:16", dir: "COMPRA", entry: 190660, exit: 190821, contracts: 3, fin: 97 },
    { time: "11:28", dir: "COMPRA", entry: 191205, exit: 191220, contracts: 1, fin: 9 },
  ]},
  // 24/02 - -R$ 224,00
  { date: "2026-02-24", results: [
    { time: "10:14", dir: "COMPRA", entry: 193600, exit: 193636, contracts: 3, fin: 22 },
    { time: "10:35", dir: "COMPRA", entry: 194235, exit: 193900, contracts: 1, fin: -201 },
    { time: "11:02", dir: "COMPRA", entry: 193895, exit: 193933, contracts: 3, fin: 23 },
    { time: "11:05", dir: "COMPRA", entry: 193995, exit: 193570, contracts: 1, fin: -255 },
    { time: "11:43", dir: "COMPRA", entry: 193710, exit: 193715, contracts: 1, fin: 3 },
    { time: "11:44", dir: "COMPRA", entry: 193750, exit: 193798, contracts: 3, fin: 29 },
    { time: "11:51", dir: "COMPRA", entry: 193740, exit: 193790, contracts: 3, fin: 30 },
    { time: "11:55", dir: "COMPRA", entry: 193845, exit: 194013, contracts: 3, fin: 101 },
  ]},
  // 25/02 - R$ 144,00
  { date: "2026-02-25", results: [
    { time: "10:32", dir: "COMPRA", entry: 195720, exit: 195490, contracts: 3, fin: -138 },
    { time: "10:35", dir: "COMPRA", entry: 195620, exit: 195450, contracts: 3, fin: -102 },
    { time: "10:43", dir: "VENDA", entry: 195030, exit: 194826, contracts: 3, fin: 122 },
  ]},
  // 26/02
  { date: "2026-02-26", results: [
    { time: "09:20", dir: "VENDA", entry: 194205, exit: 194003, contracts: 3, fin: 121 },
    { time: "10:35", dir: "COMPRA", entry: 193845, exit: 194080, contracts: 3, fin: 141 },
  ]},

  // ===== MARCO 2026 =====
  // 02/03 - R$ 164,00
  { date: "2026-03-02", results: [
    { time: "09:05", dir: "COMPRA", entry: 190350, exit: 190623, contracts: 3, fin: 164 },
  ]},
  // 03/03 - R$ 201,00
  { date: "2026-03-03", results: [
    { time: "09:08", dir: "VENDA", entry: 186970, exit: 186950, contracts: 1, fin: 12 },
    { time: "09:12", dir: "COMPRA", entry: 188000, exit: 188010, contracts: 1, fin: 6 },
    { time: "09:15", dir: "COMPRA", entry: 188171, exit: 188241, contracts: 3, fin: 42 },
    { time: "11:03", dir: "COMPRA", entry: 185675, exit: 185680, contracts: 1, fin: 3 },
    { time: "11:31", dir: "COMPRA", entry: 185235, exit: 185465, contracts: 3, fin: 138 },
  ]},
  // 04/03 - R$ 65,00
  { date: "2026-03-04", results: [
    { time: "11:54", dir: "COMPRA", entry: 186685, exit: 186790, contracts: 1, fin: 63 },
    { time: "12:58", dir: "COMPRA", entry: 187175, exit: 187180, contracts: 1, fin: 2 },
  ]},
  // 06/03 - -R$ 1,00
  { date: "2026-03-06", results: [
    { time: "09:29", dir: "COMPRA", entry: 182695, exit: 182415, contracts: 3, fin: -168 },
    { time: "10:00", dir: "COMPRA", entry: 182030, exit: 182308, contracts: 3, fin: 167 },
  ]},
  // 09/03 - R$ 22,00
  { date: "2026-03-09", results: [
    { time: "09:05", dir: "COMPRA", entry: 181055, exit: 181138, contracts: 3, fin: 50 },
    { time: "09:15", dir: "COMPRA", entry: 181130, exit: 181156, contracts: 3, fin: 16 },
    { time: "09:31", dir: "COMPRA", entry: 181135, exit: 180760, contracts: 1, fin: -225 },
    { time: "09:46", dir: "COMPRA", entry: 181025, exit: 181290, contracts: 3, fin: 159 },
    { time: "10:25", dir: "COMPRA", entry: 181575, exit: 181596, contracts: 3, fin: 13 },
  ]},
  // 10/03 - R$ 192,00
  { date: "2026-03-10", results: [
    { time: "09:22", dir: "COMPRA", entry: 183915, exit: 184120, contracts: 1, fin: 123 },
    { time: "10:28", dir: "COMPRA", entry: 183840, exit: 183845, contracts: 1, fin: 3 },
    { time: "11:25", dir: "COMPRA", entry: 183945, exit: 184050, contracts: 1, fin: 63 },
    { time: "11:29", dir: "COMPRA", entry: 184310, exit: 184315, contracts: 1, fin: 3 },
  ]},
  // 12/03 - -R$ 120,00
  { date: "2026-03-12", results: [
    { time: "09:20", dir: "COMPRA", entry: 183823, exit: 183355, contracts: 3, fin: -281 },
    { time: "09:25", dir: "COMPRA", entry: 183730, exit: 183826, contracts: 3, fin: 77 },
    { time: "10:07", dir: "COMPRA", entry: 183965, exit: 183335, contracts: 1, fin: -378 },
    { time: "10:16", dir: "VENDA", entry: 183385, exit: 183185, contracts: 1, fin: -160 },
    { time: "10:41", dir: "VENDA", entry: 181632, exit: 181820, contracts: 3, fin: 188 },
    { time: "10:48", dir: "COMPRA", entry: 181730, exit: 182068, contracts: 3, fin: 203 },
    { time: "10:50", dir: "COMPRA", entry: 182295, exit: 182010, contracts: 1, fin: -171 },
    { time: "11:25", dir: "COMPRA", entry: 181935, exit: 182061, contracts: 3, fin: 76 },
    { time: "12:25", dir: "COMPRA", entry: 181050, exit: 181130, contracts: 1, fin: 64 },
    { time: "13:02", dir: "COMPRA", entry: 181585, exit: 181783, contracts: 3, fin: 119 },
  ]},
  // 16/03 - -R$ 552,00
  { date: "2026-03-16", results: [
    { time: "09:59", dir: "VENDA", entry: 182385, exit: 182348, contracts: 3, fin: 22 },
    { time: "10:06", dir: "COMPRA", entry: 182765, exit: 182440, contracts: 1, fin: -195 },
    { time: "10:22", dir: "COMPRA", entry: 182600, exit: 182435, contracts: 3, fin: -99 },
    { time: "10:30", dir: "COMPRA", entry: 182405, exit: 182848, contracts: 3, fin: 266 },
    { time: "11:08", dir: "COMPRA", entry: 183200, exit: 182575, contracts: 1, fin: -375 },
    { time: "11:32", dir: "VENDA", entry: 182350, exit: 182071, contracts: 3, fin: 223 },
    { time: "12:42", dir: "COMPRA", entry: 182225, exit: 181655, contracts: 1, fin: -456 },
    { time: "14:54", dir: "COMPRA", entry: 182265, exit: 182567, contracts: 3, fin: 121 },
  ]},
  // 18/03 - R$ 197,00
  { date: "2026-03-18", results: [
    { time: "10:17", dir: "COMPRA", entry: 181505, exit: 181791, contracts: 3, fin: 172 },
    { time: "11:46", dir: "COMPRA", entry: 181835, exit: 181876, contracts: 3, fin: 25 },
  ]},
  // 20/03 - R$ 149,00
  { date: "2026-03-20", results: [
    { time: "10:15", dir: "VENDA", entry: 180530, exit: 180341, contracts: 3, fin: 113 },
    { time: "10:20", dir: "COMPRA", entry: 180650, exit: 180710, contracts: 3, fin: 36 },
  ]},
  // 24/03 - R$ 116,00
  { date: "2026-03-24", results: [
    { time: "09:54", dir: "COMPRA", entry: 182725, exit: 182280, contracts: 1, fin: -267 },
    { time: "10:09", dir: "VENDA", entry: 181970, exit: 181770, contracts: 3, fin: 120 },
    { time: "10:46", dir: "COMPRA", entry: 181940, exit: 181998, contracts: 3, fin: 35 },
    { time: "10:57", dir: "COMPRA", entry: 182125, exit: 182441, contracts: 3, fin: 190 },
    { time: "11:05", dir: "COMPRA", entry: 182835, exit: 182840, contracts: 1, fin: 3 },
  ]},
  // 26/03 - R$ 304,00
  { date: "2026-03-26", results: [
    { time: "10:01", dir: "COMPRA", entry: 184745, exit: 185116, contracts: 3, fin: 223 },
    { time: "10:46", dir: "COMPRA", entry: 185765, exit: 185895, contracts: 1, fin: 78 },
  ]},
  // 30/03 - R$ 293,00
  { date: "2026-03-30", results: [
    { time: "09:37", dir: "COMPRA", entry: 183965, exit: 184018, contracts: 3, fin: 32 },
    { time: "10:01", dir: "COMPRA", entry: 184445, exit: 184595, contracts: 1, fin: 30 },
    { time: "10:24", dir: "COMPRA", entry: 184510, exit: 184555, contracts: 3, fin: 27 },
    { time: "10:32", dir: "COMPRA", entry: 184710, exit: 184840, contracts: 1, fin: 78 },
    { time: "11:12", dir: "COMPRA", entry: 184330, exit: 184365, contracts: 3, fin: 21 },
    { time: "11:47", dir: "COMPRA", entry: 184365, exit: 184540, contracts: 1, fin: 105 },
  ]},

  // ===== ABRIL 2026 =====
  // 07/04 - R$ 154,00
  { date: "2026-04-07", results: [
    { time: "09:55", dir: "COMPRA", entry: 187825, exit: 187836, contracts: 3, fin: 7 },
    { time: "11:20", dir: "COMPRA", entry: 187025, exit: 187191, contracts: 3, fin: 100 },
    { time: "11:30", dir: "COMPRA", entry: 187580, exit: 187390, contracts: 1, fin: -114 },
    { time: "11:33", dir: "COMPRA", entry: 187635, exit: 187903, contracts: 3, fin: 161 },
  ]},
  // 08/04 - -R$ 258,00
  { date: "2026-04-08", results: [
    { time: "09:08", dir: "VENDA", entry: 193605, exit: 193600, contracts: 1, fin: 3 },
    { time: "10:01", dir: "COMPRA", entry: 195130, exit: 195201, contracts: 3, fin: 43 },
    { time: "10:03", dir: "COMPRA", entry: 195300, exit: 194980, contracts: 1, fin: -192 },
    { time: "10:16", dir: "VENDA", entry: 194300, exit: 194181, contracts: 3, fin: 71 },
    { time: "10:39", dir: "VENDA", entry: 192625, exit: 192551, contracts: 3, fin: 44 },
    { time: "10:43", dir: "VENDA", entry: 192300, exit: 192810, contracts: 1, fin: -306 },
    { time: "10:46", dir: "COMPRA", entry: 192978, exit: 193073, contracts: 3, fin: 76 },
  ]},
  // 09/04 - R$ 113,00
  { date: "2026-04-09", results: [
    { time: "09:14", dir: "VENDA", entry: 192580, exit: 193005, contracts: 1, fin: -255 },
    { time: "09:30", dir: "COMPRA", entry: 193205, exit: 192945, contracts: 1, fin: -208 },
    { time: "09:34", dir: "COMPRA", entry: 193150, exit: 193235, contracts: 1, fin: 68 },
    { time: "09:45", dir: "COMPRA", entry: 193410, exit: 193500, contracts: 1, fin: 72 },
    { time: "09:56", dir: "COMPRA", entry: 193735, exit: 193852, contracts: 3, fin: 94 },
    { time: "10:11", dir: "VENDA", entry: 193465, exit: 193725, contracts: 1, fin: -208 },
    { time: "10:21", dir: "COMPRA", entry: 193705, exit: 194218, contracts: 3, fin: 513 },
    { time: "10:42", dir: "COMPRA", entry: 194915, exit: 194625, contracts: 1, fin: -174 },
    { time: "11:39", dir: "COMPRA", entry: 194175, exit: 194269, contracts: 3, fin: 94 },
    { time: "11:44", dir: "COMPRA", entry: 194305, exit: 194586, contracts: 3, fin: 281 },
    { time: "11:59", dir: "COMPRA", entry: 194795, exit: 194974, contracts: 3, fin: 179 },
    { time: "12:17", dir: "COMPRA", entry: 195025, exit: 195221, contracts: 3, fin: 118 },
  ]},
  // 13/04 - R$ 65,00
  { date: "2026-04-13", results: [
    { time: "09:46", dir: "COMPRA", entry: 196620, exit: 196711, contracts: 3, fin: 55 },
    { time: "10:01", dir: "COMPRA", entry: 196980, exit: 196710, contracts: 1, fin: -162 },
    { time: "10:04", dir: "COMPRA", entry: 197015, exit: 197196, contracts: 3, fin: 109 },
    { time: "11:45", dir: "COMPRA", entry: 197060, exit: 196710, contracts: 1, fin: -210 },
    { time: "12:23", dir: "COMPRA", entry: 196695, exit: 196740, contracts: 1, fin: 27 },
    { time: "12:52", dir: "COMPRA", entry: 196940, exit: 197053, contracts: 3, fin: 113 },
    { time: "13:12", dir: "COMPRA", entry: 197180, exit: 197238, contracts: 3, fin: 35 },
    { time: "13:35", dir: "COMPRA", entry: 197445, exit: 197476, contracts: 3, fin: 19 },
    { time: "13:42", dir: "COMPRA", entry: 197470, exit: 197551, contracts: 3, fin: 49 },
  ]},
  // 14/04 - -R$ 77,00
  { date: "2026-04-14", results: [
    { time: "10:11", dir: "COMPRA", entry: 198690, exit: 198701, contracts: 3, fin: 7 },
    { time: "10:17", dir: "COMPRA", entry: 198780, exit: 198853, contracts: 3, fin: 44 },
    { time: "10:41", dir: "COMPRA", entry: 199250, exit: 198965, contracts: 1, fin: -171 },
    { time: "10:56", dir: "COMPRA", entry: 199335, exit: 199448, contracts: 3, fin: 68 },
    { time: "11:09", dir: "COMPRA", entry: 199460, exit: 198905, contracts: 1, fin: -333 },
    { time: "11:33", dir: "COMPRA", entry: 199060, exit: 199105, contracts: 1, fin: 45 },
    { time: "12:19", dir: "COMPRA", entry: 198585, exit: 198754, contracts: 3, fin: 169 },
    { time: "12:28", dir: "COMPRA", entry: 198975, exit: 199064, contracts: 3, fin: 89 },
  ]},
  // 15/04 - R$ 208,00
  { date: "2026-04-15", results: [
    { time: "10:15", dir: "COMPRA", entry: 198157, exit: 198180, contracts: 3, fin: 27 },
    { time: "10:25", dir: "COMPRA", entry: 198440, exit: 198583, contracts: 3, fin: 86 },
    { time: "10:30", dir: "COMPRA", entry: 198875, exit: 199033, contracts: 3, fin: 95 },
  ]},
  // 17/04 - R$ 230,00
  { date: "2026-04-17", results: [
    { time: "09:21", dir: "COMPRA", entry: 201570, exit: 201666, contracts: 3, fin: 58 },
    { time: "09:25", dir: "COMPRA", entry: 201845, exit: 201911, contracts: 3, fin: 40 },
    { time: "09:46", dir: "COMPRA", entry: 202300, exit: 202530, contracts: 3, fin: 138 },
    { time: "11:11", dir: "COMPRA", entry: 201640, exit: 200475, contracts: 1, fin: -466 },
    { time: "11:50", dir: "VENDA", entry: 200125, exit: 199770, contracts: 1, fin: 355 },
    { time: "11:55", dir: "COMPRA", entry: 199975, exit: 200050, contracts: 1, fin: 75 },
    { time: "12:01", dir: "COMPRA", entry: 200195, exit: 200225, contracts: 1, fin: 30 },
  ]},
  // 22/04 - R$ 254,00
  { date: "2026-04-22", results: [
    { time: "09:22", dir: "COMPRA", entry: 199265, exit: 199561, contracts: 3, fin: 178 },
    { time: "10:23", dir: "COMPRA", entry: 199705, exit: 199380, contracts: 1, fin: -195 },
    { time: "10:36", dir: "VENDA", entry: 198545, exit: 198540, contracts: 1, fin: 5 },
    { time: "10:44", dir: "COMPRA", entry: 198335, exit: 198600, contracts: 1, fin: 265 },
    { time: "11:49", dir: "COMPRA", entry: 197485, exit: 197260, contracts: 1, fin: -90 },
    { time: "12:48", dir: "COMPRA", entry: 197330, exit: 197420, contracts: 1, fin: 54 },
  ]},
  // 23/04 - R$ 167,00
  { date: "2026-04-23", results: [
    { time: "09:08", dir: "COMPRA", entry: 196425, exit: 196506, contracts: 3, fin: 49 },
    { time: "09:32", dir: "COMPRA", entry: 196500, exit: 196523, contracts: 3, fin: 14 },
    { time: "10:13", dir: "COMPRA", entry: 196605, exit: 196691, contracts: 3, fin: 52 },
    { time: "10:31", dir: "COMPRA", entry: 196905, exit: 196991, contracts: 3, fin: 52 },
  ]},
  // 27/04 - R$ 3,00
  { date: "2026-04-27", results: [
    { time: "12:15", dir: "COMPRA", entry: 193570, exit: 193575, contracts: 1, fin: 3 },
    { time: "12:17", dir: "COMPRA", entry: 193600, exit: 193595, contracts: 1, fin: -3 },
  ]},
  // 29/04 - R$ 80,00
  { date: "2026-04-29", results: [
    { time: "10:14", dir: "COMPRA", entry: 190675, exit: 190615, contracts: 1, fin: -36 },
    { time: "10:46", dir: "VENDA", entry: 189695, exit: 189640, contracts: 1, fin: 33 },
    { time: "10:50", dir: "COMPRA", entry: 189705, exit: 189710, contracts: 1, fin: 3 },
    { time: "11:45", dir: "COMPRA", entry: 189685, exit: 189818, contracts: 3, fin: 80 },
  ]},
];

async function main() {
  console.log("Seeding database with PDF report data...");

  // Clear existing data
  await prisma.trade.deleteMany();
  await prisma.brokerReport.deleteMany();

  let tradeCount = 0;

  for (const day of dailyData) {
    for (const trade of day.results) {
      const direction = trade.dir;
      const points = direction === "COMPRA"
        ? trade.exit - trade.entry
        : trade.entry - trade.exit;
      const result = trade.fin > 0 ? "GAIN" : trade.fin < 0 ? "LOSS" : "ZERO";

      await prisma.trade.create({
        data: {
          date: new Date(day.date),
          time: trade.time,
          asset: "WIN",
          direction: trade.dir,
          entryPrice: trade.entry,
          exitPrice: trade.exit,
          contracts: trade.contracts,
          result,
          points: points,
          financialResult: trade.fin,
          durationMinutes: null,
          notes: null,
        },
      });
      tradeCount++;
    }
  }

  // Create broker reports with monthly summaries
  const reports = [
    {
      date: new Date("2026-02-28"),
      filename: "relatorio-fev-2026.pdf",
      originalName: "RELATORIO PERFORMANCE 2026 - FEVEREIRO.pdf",
      totalTrades: 179,
      totalGain: 4177,
      totalLoss: -4218,
      netResult: -41,
      fees: null,
    },
    {
      date: new Date("2026-03-31"),
      filename: "relatorio-mar-2026.pdf",
      originalName: "RELATORIO PERFORMANCE 2026 - MARCO.pdf",
      totalTrades: 156,
      totalGain: 4384,
      totalLoss: -3354,
      netResult: 1030,
      fees: null,
    },
    {
      date: new Date("2026-04-29"),
      filename: "relatorio-abr-2026.pdf",
      originalName: "RELATORIO PERFORMANCE 2026 - ABRIL.pdf",
      totalTrades: 137,
      totalGain: 4657,
      totalLoss: -3718,
      netResult: 939,
      fees: null,
    },
  ];

  for (const report of reports) {
    await prisma.brokerReport.create({ data: report });
  }

  console.log(`Seeded ${tradeCount} trades and ${reports.length} broker reports.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
