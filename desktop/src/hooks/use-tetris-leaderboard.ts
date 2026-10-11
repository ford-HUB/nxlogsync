import { useEffect, useRef } from 'react'
import { connectTetrisSocket, type TetrisSocket } from '@/services/tetris-socket'
import { useSiteSessionStore } from '@/store/site-session-store'
import { useTetrisLeaderboardStore } from '@/store/tetris-leaderboard-store'

/**
 * The board for one start level, fetched when it changes and kept live over the socket. Needs a
 * connected account (scores live on it); signing out or switching user forgets the boards.
 */
export function useTetrisLeaderboard(setup: string) {
  const board = useTetrisLeaderboardStore((s) => s.boards[setup])
  const loading = useTetrisLeaderboardStore((s) => s.loadingSetup === setup)
  const error = useTetrisLeaderboardStore((s) => s.error)
  const live = useTetrisLeaderboardStore((s) => s.live)
  const fetchBoard = useTetrisLeaderboardStore((s) => s.fetchBoard)
  const submitScore = useTetrisLeaderboardStore((s) => s.submitScore)
  const reset = useTetrisLeaderboardStore((s) => s.reset)
  const userId = useSiteSessionStore((s) => s.target.userId)

  // Another user's boards would flag the wrong row as "you".
  const userRef = useRef(userId)
  useEffect(() => {
    if (userRef.current !== userId) reset()
    userRef.current = userId
  }, [userId, reset])

  useEffect(() => {
    if (userId !== null) void fetchBoard(setup)
  }, [fetchBoard, setup, userId])

  useTetrisLeaderboardSocket(setup, userId !== null)

  return { board, loading, error, live, retry: () => void fetchBoard(setup), submitScore }
}

/**
 * Keeps a Socket.IO link open while Tetris is on screen, watching the start level shown, so other
 * players' new bests land on the board as they happen. A reconnect re-fetches the board, since
 * pushes made while offline were missed.
 */
function useTetrisLeaderboardSocket(setup: string, enabled: boolean) {
  const setLive = useTetrisLeaderboardStore((s) => s.setLive)
  const applyPush = useTetrisLeaderboardStore((s) => s.applyPush)
  const fetchBoard = useTetrisLeaderboardStore((s) => s.fetchBoard)
  const socketRef = useRef<TetrisSocket | null>(null)
  const setupRef = useRef(setup)
  setupRef.current = setup

  useEffect(() => {
    if (!enabled) return
    const socket = connectTetrisSocket()
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
  }, [enabled, setLive, applyPush, fetchBoard])

  // A different start level on screen: watch that board instead.
  useEffect(() => {
    const socket = socketRef.current
    if (socket?.connected) socket.emit('subscribe', { setup }, () => {})
  }, [setup])
}
