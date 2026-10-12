import { z } from 'zod';

/** A control holds this many keys at most, and always at least one (as the desktop's MAX_KEYS_PER_CONTROL). */
const MAX_KEYS_PER_CONTROL = 3;

/** Keys every game already uses: esc closes, tab restarts. */
const RESERVED_KEYS: Record<string, string> = {
  Escape: 'close',
  Tab: 'restart',
};

/** A KeyboardEvent.key, letters lowercased by the desktop: " ", "j", "ArrowUp". */
const KeySchema = z
  .string()
  .min(1, 'A key is empty.')
  .max(20, 'A key name is too long.')
  .refine((k) => !RESERVED_KEYS[k], {
    message: 'Esc and Tab are kept for close and restart.',
  });

const ControlKeysSchema = z
  .array(KeySchema)
  .min(1, 'Every control needs a key.')
  .max(
    MAX_KEYS_PER_CONTROL,
    `A control takes up to ${MAX_KEYS_PER_CONTROL} keys.`,
  );

/** One game's controls: no key may do two things in the same game. */
const gameKeys = <S extends z.ZodRawShape>(label: string, shape: S) =>
  z
    .object(shape)
    .strict()
    .superRefine((controls, ctx) => {
      const owner = new Map<string, string>();
      for (const [control, keys] of Object.entries(
        controls as Record<string, string[]>,
      )) {
        for (const key of keys) {
          const taken = owner.get(key);
          if (taken !== undefined) {
            const name = key === ' ' ? 'space' : key;
            ctx.addIssue({
              code: 'custom',
              path: [control],
              message:
                taken === control
                  ? `${name} is on ${control} twice in ${label}.`
                  : `${name} is both ${taken} and ${control} in ${label}.`,
            });
          }
          owner.set(key, control);
        }
      }
    });

const RunBindingsSchema = z
  .object({
    'speed-run': gameKeys('Speed run', {
      jump: ControlKeysSchema,
      slide: ControlKeysSchema,
      punch: ControlKeysSchema,
      kick: ControlKeysSchema,
      fire: ControlKeysSchema,
      slow: ControlKeysSchema,
      phase: ControlKeysSchema,
    }),
    'pass-or-fall': gameKeys('Pass or fall', {
      left: ControlKeysSchema,
      right: ControlKeysSchema,
      jump: ControlKeysSchema,
    }),
  })
  .strict();

export const RunSettingsSchema = z.object({ keys: RunBindingsSchema }).strict();

export const RunSettingsResponseSchema = z.object({
  /** Null until the user first saves; the desktop then plays on its defaults. */
  keys: RunBindingsSchema.nullable(),
});
