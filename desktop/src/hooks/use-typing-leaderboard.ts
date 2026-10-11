import { useEffect, useRef, useState } from 'react'
import { NAME_CHECK_DEBOUNCE_MS } from '@/constants/typing-test'
import { checkTypingName } from '@/services/typing-service'
import { connectTypingSocket, type TypingSocket } from '@/services/typing-socket'
import { useSiteSessionStore } from '@/store/site-session-store'
import { useTypingLeaderboardStore } from '@/store/typing-leaderboard-store'

/**
 * The signed-in user's leaderboard name, read from the server whenever the user changes;
 * signing out forgets it and the boards.
 */
export function useTypingPlayer() {
  const playerName = useTypingLeaderboardStore((s) => s.playerName)
  const playerStatus = useTypingLeaderboardStore((s) => s.playerStatus)
  const fetchPlayer = useTypingLeaderboardStore((s) => s.fetchPlayer)
  const savePlayer = useTypingLeaderboardStore((s) => s.savePlayer)
  const playerFor = useTypingLeaderboardStore((s) => s.playerFor)
  const reset = useTypingLeaderboardStore((s) => s.reset)
  const userId = useSiteSessionStore((s) => s.target.userId)

  useEffect(() => {
    if (userId === playerFor) return
    reset()
    if (userId !== null) void fetchPlayer(userId)
  }, [fetchPlayer, reset, userId, playerFor])

  // The server came back: ask again, so the name prompt and saving scores resume on their own.
  const live = useTypingLeaderboardStore((s) => s.live)
  useEffect(() => {
    if (live === 'live' && playerStatus === 'error' && userId !== null) void fetchPlayer(userId)
    // Only on reconnect, not on every failed retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live])

  const retry = () => {
    if (userId !== null) void fetchPlayer(userId)
  }

  return { playerName, playerStatus, savePlayer, retry }
}

/** The board for one test setup, fetched when the setup changes. */
export function useLeaderboard(setup: string) {
  const board = useTypingLeaderboardStore((s) => s.boards[setup])
  const loading = useTypingLeaderboardStore((s) => s.loadingSetup === setup)
  const error = useTypingLeaderboardStore((s) => s.error)
  const fetchBoard = useTypingLeaderboardStore((s) => s.fetchBoard)
  const submitScore = useTypingLeaderboardStore((s) => s.submitScore)

  useEffect(() => {
    void fetchBoard(setup)
  }, [fetchBoard, setup])

  useLeaderboardSocket(setup)

  return { board, loading, error, retry: () => void fetchBoard(setup), submitScore }
}

/**
 * Keeps a Socket.IO link open while the test is on screen, watching the setup shown, so other
 * players' new bests land on the board as they happen. A reconnect re-fetches the board, since
 * pushes made while offline were missed.
 */
function useLeaderboardSocket(setup: string) {
  const setLive = useTypingLeaderboardStore((s) => s.setLive)
  const applyPush = useTypingLeaderboardStore((s) => s.applyPush)
  const fetchBoard = useTypingLeaderboardStore((s) => s.fetchBoard)
  const socketRef = useRef<TypingSocket | null>(null)
  const setupRef = useRef(setup)
  setupRef.current = setup

  useEffect(() => {
    const socket = connectTypingSocket()
    socketRef.current = socket
    let connectedOnce = false
    setLive('connecting')

    socket.on('connect', () => {
      setLive('live')
      socket.emit('subscribe', { setup: setupRef.current }, () => {})
      if (connectedOnce) void fetchBoard(setupRef.current)
      connectedOnce = true
    })
    socket.on('disconnect', () => setLive('offline'))
    socket.on('connect_error', () => setLive('offline'))
    socket.on('leaderboard', (push) => {
      if (push.setup === setupRef.current) applyPush(push.setup, push.entries)
    })

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
      setLive('offline')
    }
  }, [setLive, applyPush, fetchBoard])

  // A different setup on screen: watch that board instead.
  useEffect(() => {
    const socket = socketRef.current
    if (socket?.connected) socket.emit('subscribe', { setup }, () => {})
  }, [setup])
}

export type NameAvailability = 'idle' | 'checking' | 'available' | 'taken' | 'error'

/**
 * Asks the server whether a leaderboard name is free, once typing pauses. Answers for a name
 * that has since changed are dropped. The save checks again, so this is only a heads-up.
 */
export function useNameAvailability(name: string): NameAvailability {
  const trimmed = name.trim()
  const [state, setState] = useState<{ name: string; status: NameAvailability }>({ name: '', status: 'idle' })

  useEffect(() => {
    if (!trimmed) return
    let stale = false
    const id = window.setTimeout(async () => {
      setState({ name: trimmed, status: 'checking' })
      const result = await checkTypingName(trimmed)
      if (stale) return
      const status = !result.success ? 'error' : result.data.available ? 'available' : 'taken'
      setState({ name: trimmed, status })
    }, NAME_CHECK_DEBOUNCE_MS)
    return () => {
      stale = true
      window.clearTimeout(id)
    }
  }, [trimmed])

  if (!trimmed) return 'idle'
  // Still waiting out the pause for this name.
  return state.name === trimmed ? state.status : 'checking'
}
