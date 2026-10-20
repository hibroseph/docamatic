// "Note deleted · Undo": a short-lived message after something that's easy to
// do by accident. One at a time; a new one replaces the last.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

interface Offer {
  id: number;
  message: string;
  undo?: () => void;
}

type OfferFn = (message: string, undo?: () => void) => void;

const UndoContext = createContext<OfferFn>(() => {});

export const useUndo = () => useContext(UndoContext);

const SHOW_FOR_MS = 6000;

export const UndoProvider = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const [offer, setOffer] = useState<Offer | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const nextId = useRef(1);

  const show = useCallback<OfferFn>((message, undo) => {
    clearTimeout(timer.current);
    setOffer({ id: nextId.current++, message, undo });
    timer.current = setTimeout(() => setOffer(null), SHOW_FOR_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <UndoContext.Provider value={show}>
      {children}
      <div className={`toast-region ${className}`} role="status" aria-live="polite">
        {offer && (
          <div className="toast" key={offer.id}>
            <span>{offer.message}</span>
            {offer.undo && (
              <button
                type="button"
                className="toast__action"
                onClick={() => {
                  offer.undo?.();
                  setOffer(null);
                }}
              >
                Undo
              </button>
            )}
          </div>
        )}
      </div>
    </UndoContext.Provider>
  );
};
