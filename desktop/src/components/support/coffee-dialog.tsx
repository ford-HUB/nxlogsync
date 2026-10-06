import { Heart } from 'lucide-react'
import { useState } from 'react'
import qrPay from '@/assets/qrpay.png'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function CoffeeDialog() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-3 left-4 z-40 cursor-pointer text-xs text-muted-foreground/40 transition-colors hover:text-muted-foreground"
      >
        Give a coffee to onedev ☕
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-5 sm:max-w-sm">
          {/* Top padding keeps the description clear of the close button. */}
          <DialogHeader className="items-center px-4 pt-6 text-center">
            {/* Radix needs a title for screen readers; it stays hidden on screen. */}
            <DialogTitle className="sr-only">Buy onedev a coffee</DialogTitle>
            <DialogDescription>
              If NXLogSync saves you time, scan the QR with any InstaPay-enabled app. Thank you!
            </DialogDescription>
          </DialogHeader>

          <div className="coffee-qr mx-auto w-full max-w-64 overflow-hidden rounded-xl border bg-white p-2 shadow-sm">
            <img src={qrPay} alt="InstaPay QR code for onedev" className="w-full" draggable={false} />
          </div>

          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            Made with <Heart className="coffee-heart size-3.5 fill-rose-500 text-rose-500" /> by onedev
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}
