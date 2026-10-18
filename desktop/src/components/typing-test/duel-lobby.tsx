import { Loader2, Lock, Send, Swords, Users, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSecondsLeft } from '@/hooks/use-typing-duel'
import { useTypingKeys } from '@/hooks/use-typing-keys'
import { cn } from '@/lib/utils'
import { useTypingDuelStore } from '@/store/typing-duel-store'
import { useTypingLeaderboardStore } from '@/store/typing-leaderboard-store'
import type { OnlinePlayer, OutgoingInvite } from '@/types/typing-duel'
import { DuelLeaderboard } from './ui/duel-leaderboard'
import { LiveBadge } from './ui/leaderboard'

interface DuelLobbyProps {
  onBack: () => void
  /** Behind a dialog: not listening for keys. */
  paused?: boolean
}

/** A sent invite's 15-second window, counting down until they answer or it expires. */
function PendingInvite({ name, expiresAt, onCancel }: { name: string; expiresAt: number | undefined; onCancel: () => void }) {
  const seconds = useSecondsLeft(expiresAt)
  return (
    <span className="flex items-center gap-2">
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Loader2 className="size-3 animate-spin" /> waiting
        <span className="w-6 text-right text-score tabular-nums">{seconds}s</span>
      </span>
      <Button size="icon-sm" variant="ghost" aria-label={`Cancel invite to ${name}`} onClick={onCancel}>
        <X />
      </Button>
    </span>
  )
}

function InviteAction({
  player,
  outgoing,
  onInvite,
  onCancel,
}: {
  player: OnlinePlayer
  outgoing: OutgoingInvite | undefined
  onInvite: () => void
  onCancel: () => void
}) {
  if (player.busy)
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {/* A span around the disabled button, so the tooltip still opens on hover. */}
          <span tabIndex={0} className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <Button size="sm" variant="outline" disabled>
              <Lock /> in a match
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {player.name} is racing {player.opponent ?? 'someone'}. Invite them once they&apos;re done.
        </TooltipContent>
      </Tooltip>
    )
  if (outgoing?.status === 'sending')
    return (
      <Button size="sm" variant="ghost" disabled>
        <Loader2 className="animate-spin" /> sending
      </Button>
    )
  if (outgoing?.status === 'pending')
    return <PendingInvite name={player.name} expiresAt={outgoing.expiresAt} onCancel={onCancel} />
  if (outgoing?.status === 'declined') return <span className="text-[11px] text-destructive">declined</span>
  if (outgoing?.status === 'expired') return <span className="text-[11px] text-muted-foreground">no answer · expired</span>
  return (
    <Button size="sm" variant={outgoing?.status === 'failed' ? 'outline' : 'default'} onClick={onInvite}>
      <Send /> {outgoing?.status === 'failed' ? 'retry' : 'invite'}
    </Button>
  )
}

/**
 * Who is online right now; inviting one sends them a challenge to accept or decline. The 1v1
 * leaderboard hugs the right edge, where the solo test has its top 100. Escape goes back.
 */
export function DuelLobby({ onBack, paused = false }: DuelLobbyProps) {
  const live = useTypingDuelStore((s) => s.live)
  const players = useTypingDuelStore((s) => s.players)
  const outgoing = useTypingDuelStore((s) => s.outgoing)
  const invite = useTypingDuelStore((s) => s.invite)
  const cancelInvite = useTypingDuelStore((s) => s.cancelInvite)
  const refreshPlayers = useTypingDuelStore((s) => s.refreshPlayers)
  const board = useTypingDuelStore((s) => s.board)
  const boardLoading = useTypingDuelStore((s) => s.boardLoading)
  const boardError = useTypingDuelStore((s) => s.boardError)
  const fetchBoard = useTypingDuelStore((s) => s.fetchBoard)
  const playerName = useTypingLeaderboardStore((s) => s.playerName)

  useEffect(() => {
    void fetchBoard()
  }, [fetchBoard])

  // The name may have been picked since the link opened; this also lists the user to others.
  useEffect(() => {
    if (live === 'live') refreshPlayers()
  }, [live, refreshPlayers])

  useTypingKeys({ onKey: () => {}, onEscape: onBack, paused })

  const busyCount = players.filter((p) => p.busy).length
  const failure = Object.values(outgoing).find((o) => o.status === 'failed')?.message

  return (
    <div className="relative min-h-dvh w-full">
      {/* Same place and size as the solo leaderboard; the lobby stays centred, narrowed to clear it. */}
      <div className="absolute inset-y-16 right-3 hidden w-[13.5rem] lg:block min-[1440px]:right-6 min-[1440px]:w-[22rem]">
        <DuelLeaderboard
          board={board}
          loading={boardLoading}
          error={boardError}
          onRetry={() => void fetchBoard()}
          live={live}
          playerName={playerName ?? ''}
        />
      </div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-3 font-mono sm:px-8 lg:max-w-[min(36rem,calc(100vw-28.5rem))] min-[1440px]:max-w-[min(36rem,calc(100vw-50rem))] [@media(min-height:720px)]:py-6">
        <div className="flex flex-1 flex-col gap-6 py-8 [@media(min-height:720px)]:py-12">
          <header className="flex flex-col gap-2">
            <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
              <Swords className="size-5" /> 1v1
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Invite someone who&apos;s online. Once they accept, you both vote on the race.
            </p>
          </header>

          <section aria-label="Online players" className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b pb-2 text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              <span className="flex items-center gap-2">
                online now <span className="text-foreground tabular-nums">{players.length}</span>
              {busyCount > 0 && (
                <span className="flex items-center gap-1 text-score normal-case tracking-normal">
                  · <Swords className="size-3" /> {busyCount} in a match
                </span>
              )}
              </span>
              <LiveBadge live={live} />
            </div>

            {live !== 'live' ? (
              <div className="flex flex-col items-center gap-2 py-16 text-center text-[13px] text-muted-foreground">
                {live === 'connecting' ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Connecting…
                  </>
                ) : (
                  <>Can&apos;t reach the server right now. It reconnects on its own.</>
                )}
              </div>
            ) : players.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Users className="size-4" />
                </span>
                <span className="text-[13px] text-foreground">Nobody else is online</span>
                <span className="max-w-xs text-[12px] text-muted-foreground">
                  Anyone with NXLogSync open and a leaderboard name shows up here.
                </span>
              </div>
            ) : (
              <ul className="flex flex-col overflow-y-auto py-1">
                <AnimatePresence initial={false}>
                  {players.map((player) => (
                    <motion.li
                      key={player.userId}
                      layout="position"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={cn(
                        'flex items-center justify-between gap-3 rounded-md px-2 py-2.5',
                        player.busy ? 'bg-muted/20' : 'hover:bg-muted/40',
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span aria-hidden className="relative flex size-2 shrink-0">
                          {player.busy && (
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-score opacity-60" />
                          )}
                          <span
                            className={cn('relative inline-flex size-2 rounded-full', player.busy ? 'bg-score' : 'bg-success')}
                          />
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <span className={cn('truncate text-[13px]', player.busy ? 'text-muted-foreground' : 'text-foreground')}>
                            {player.name}
                          </span>
                          {player.busy ? (
                            <span className="flex items-center gap-1 truncate text-[11px] text-score">
                              <Swords className="size-3 shrink-0" /> battling
                              {player.opponent && <span className="truncate">vs {player.opponent}</span>}
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">available</span>
                          )}
                        </span>
                      </span>
                      <InviteAction
                        player={player}
                        outgoing={outgoing[player.userId]}
                        onInvite={() => void invite(player.userId)}
                        onCancel={() => cancelInvite(player.userId)}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
            {failure && <p className="pt-3 text-[12px] text-destructive">{failure}</p>}
          </section>
        </div>

        <footer className="flex justify-center gap-6 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-2">
            <kbd className="rounded-md border bg-muted/60 px-1.5 py-0.5 text-foreground">esc</kbd> back
          </span>
        </footer>
      </div>
    </div>
  )
}
