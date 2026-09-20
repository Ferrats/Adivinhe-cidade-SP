export type RoundResult = {
  city: string
  solved: boolean
  attempts: number
}

export function summarizeResults(results: RoundResult[]) {
  const solvedResults = results.filter((item) => item.solved)
  const solved = solvedResults.length
  const averageAttempts = solved
    ? solvedResults.reduce((sum, item) => sum + item.attempts, 0) / solved
    : 0

  const best = solvedResults.length
    ? solvedResults.reduce((currentBest, item) =>
        item.attempts < currentBest.attempts ? item : currentBest,
      )
    : null

  return { solved, averageAttempts, best }
}
