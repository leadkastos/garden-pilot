// Frost risk checker. Given a planting date, days to maturity, production weeks,
// and the user's two frost dates ("MM-DD"), returns a warning object or null.
//
// Two checks:
//   1. Too late: planting + maturity + production runs past the first fall frost.
//   2. Too early: planting is before the last spring frost (cold-sensitive risk).
//
// Everything is framed as an estimate — real frost timing varies year to year.

function mmddToDate(mmdd, year) {
  if (!mmdd || !/^\d{2}-\d{2}$/.test(mmdd)) return null
  const [m, d] = mmdd.split('-').map(Number)
  return new Date(year, m - 1, d)
}

function fmt(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// planting: ISO string "YYYY-MM-DD" or Date-parseable
// maturityDays, productionWeeks: numbers (productionWeeks optional)
// springFrost, fallFrost: "MM-DD" strings from profile
export function checkFrostRisk({ planting, maturityDays, productionWeeks, springFrost, fallFrost }) {
  if (!planting) return null
  const plantDate = new Date(planting.length <= 10 ? planting + 'T12:00:00' : planting)
  if (isNaN(plantDate)) return null

  const year = plantDate.getFullYear()
  const spring = mmddToDate(springFrost, year)
  const fall = mmddToDate(fallFrost, year)

  // --- Too early check (spring) ---
  if (spring && plantDate < spring) {
    return {
      level: 'warning',
      kind: 'too-early',
      message: `You're planting before your average last spring frost (around ${fmt(spring)}). Cold-sensitive plants may get damaged — consider waiting, or protect them from frost.`,
    }
  }

  // --- Too late check (fall) ---
  if (fall && maturityDays) {
    const daysNeeded = Number(maturityDays) + (Number(productionWeeks || 0) * 7)
    const finishDate = new Date(plantDate)
    finishDate.setDate(finishDate.getDate() + daysNeeded)

    if (finishDate > fall) {
      const prodNote = productionWeeks
        ? ` and produce for about ${productionWeeks} week${Number(productionWeeks) === 1 ? '' : 's'}`
        : ''
      return {
        level: 'warning',
        kind: 'too-late',
        message: `This may not have enough time. To fully mature${prodNote}, it needs until about ${fmt(finishDate)} — but your average first fall frost is around ${fmt(fall)}. Consider planting sooner or choosing a faster-maturing variety.`,
      }
    }

    // Close call — within 2 weeks of frost
    const twoWeeksBefore = new Date(fall)
    twoWeeksBefore.setDate(twoWeeksBefore.getDate() - 14)
    if (finishDate > twoWeeksBefore) {
      return {
        level: 'caution',
        kind: 'cutting-it-close',
        message: `Cutting it close — this should finish around ${fmt(finishDate)}, just before your average first fall frost (${fmt(fall)}). Should work, but watch the weather.`,
      }
    }
  }

  return null
}
