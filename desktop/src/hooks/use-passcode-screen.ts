import { useEffect, useState } from 'react'
import {
  PASSCODE_COOLDOWN_MS,
  PASSCODE_LENGTH,
  PASSCODE_MAX_ATTEMPTS,
  PASSCODE_MESSAGE,
} from '@/constants/passcode'
import { usePasscodeStore } from '@/store/passcode-store'

export type PasscodeStep = 'create' | 'confirm' | 'unlock'

const DIGITS_ONLY = /\D/g

/** Drives the lock screen: two-step creation on first launch, then unlock with a cooldown after repeated misses. */
export function usePasscodeScreen() {
  const status = usePasscodeStore((s) => s.status)
  const lockReason = usePasscodeStore((s) => s.lockReason)
  const replacing = usePasscodeStore((s) => s.replacing)
  const cancelReset = usePasscodeStore((s) => s.cancelReset)
  const createPasscode = usePasscodeStore((s) => s.createPasscode)
  const unlock = usePasscodeStore((s) => s.unlock)

  const [step, setStep] = useState<PasscodeStep>(status === 'setup' ? 'create' : 'unlock')
  const [value, setValue] = useState('')
  const [firstEntry, setFirstEntry] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [misses, setMisses] = useState(0)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    setStep(status === 'setup' ? 'create' : 'unlock')
    setValue('')
    setError(null)
  }, [status])

  useEffect(() => {
    if (cooldownUntil === null) return
    const timer = window.setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= cooldownUntil) {
        setCooldownUntil(null)
        setMisses(0)
        setError(null)
      }
    }, 250)
    return () => window.clearInterval(timer)
  }, [cooldownUntil])

  const cooldownSeconds = cooldownUntil === null ? 0 : Math.max(0, Math.ceil((cooldownUntil - now) / 1000))

  const submit = async (code: string) => {
    if (step === 'create') {
      setFirstEntry(code)
      setValue('')
      setStep('confirm')
      return
    }
    if (step === 'confirm') {
      if (code !== firstEntry) {
        setError(PASSCODE_MESSAGE.mismatch)
        setFirstEntry('')
        setValue('')
        setStep('create')
        return
      }
      setBusy(true)
      const message = await createPasscode(code)
      setBusy(false)
      if (message) setError(message)
      return
    }
    setBusy(true)
    const ok = await unlock(code)
    setBusy(false)
    if (ok) return
    const nextMisses = misses + 1
    setMisses(nextMisses)
    setValue('')
    if (nextMisses >= PASSCODE_MAX_ATTEMPTS) {
      const until = Date.now() + PASSCODE_COOLDOWN_MS
      setNow(Date.now())
      setCooldownUntil(until)
      setError(`Too many wrong attempts.`)
    } else {
      const left = PASSCODE_MAX_ATTEMPTS - nextMisses
      setError(`${PASSCODE_MESSAGE.wrong} ${left} ${left === 1 ? 'try' : 'tries'} left.`)
    }
  }

  const change = (raw: string) => {
    if (busy || cooldownUntil !== null) return
    const digits = raw.replace(DIGITS_ONLY, '').slice(0, PASSCODE_LENGTH)
    setValue(digits)
    if (digits.length > 0 && step !== 'confirm') setError(null)
    if (digits.length === PASSCODE_LENGTH) void submit(digits)
  }

  /** Lets the user restart creation if they mistyped the first entry. */
  const restart = () => {
    setFirstEntry('')
    setValue('')
    setError(null)
    setStep('create')
  }

  return {
    step,
    value,
    error,
    busy,
    lockReason: step === 'unlock' ? lockReason : null,
    replacing,
    cancelReset,
    coolingDown: cooldownUntil !== null,
    cooldownSeconds,
    change,
    restart,
  }
}
