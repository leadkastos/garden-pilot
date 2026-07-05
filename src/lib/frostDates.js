// Rough frost-date estimates keyed to the first digit(s) of a US zip code.
// This is intentionally approximate — it pre-fills the profile so the user
// has a sensible starting point, then they confirm/override with their own
// local frost dates (which experienced gardeners reliably know).
//
// Dates are stored as "MM-DD" (year-independent).
// spring = average last spring frost, fall = average first fall frost.

const FROST_BY_ZIP3 = {
  // Northeast / cold
  '0': { spring: '05-15', fall: '10-01' }, // CT, MA, ME, NH, NJ, RI, VT
  '1': { spring: '05-10', fall: '10-05' }, // NY, PA (northern)
  '2': { spring: '04-20', fall: '10-25' }, // DC, MD, NC, SC, VA, WV
  '3': { spring: '03-15', fall: '11-25' }, // AL, FL, GA, MS, TN (warm south)
  '4': { spring: '05-05', fall: '10-10' }, // IN, KY, MI, OH
  '5': { spring: '05-15', fall: '09-25' }, // IA, MN, MT, ND, SD, WI (cold north)
  '6': { spring: '04-25', fall: '10-15' }, // IL, KS, MO, NE
  '7': { spring: '03-20', fall: '11-15' }, // AR, LA, OK, TX (warm)
  '8': { spring: '05-10', fall: '10-05' }, // AZ, CO, ID, NM, NV, UT, WY (varies w/ elevation)
  '9': { spring: '03-01', fall: '12-01' }, // CA, OR, WA, AK, HI (mild coastal default)
}

// Tennessee-specific tightening for the founder's home region (37xxx = Middle TN).
const FROST_BY_ZIP_OVERRIDES = {
  '370': { spring: '04-15', fall: '10-30' },
  '371': { spring: '04-15', fall: '10-30' },
  '372': { spring: '04-15', fall: '10-30' },
}

export function estimateFrostDates(zip) {
  if (!zip || zip.length < 1) return null
  const three = zip.slice(0, 3)
  if (FROST_BY_ZIP_OVERRIDES[three]) return FROST_BY_ZIP_OVERRIDES[three]
  const first = zip[0]
  return FROST_BY_ZIP3[first] || null
}

// Format "MM-DD" -> "Apr 15" for display
export function formatFrost(mmdd) {
  if (!mmdd || !/^\d{2}-\d{2}$/.test(mmdd)) return '—'
  const [m, d] = mmdd.split('-').map(Number)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[m - 1]} ${d}`
}
