import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";

export default function SelectDrawer({ value, onValueChange, options, placeholder, label, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={className}>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm flex items-center justify-between hover:bg-accent/5 transition-colors"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className={selectedOption ? "text-foreground" : "text-muted-foreground"}>
          {selectedOption?.label || placeholder || "Select..."}
        </span>
        <ChevronDown className="w-4 h-4 opacity-50" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ y: 400, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 400, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl max-h-80 overflow-y-auto"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              {label && (
                <div className="sticky top-0 bg-card border-b border-border p-4">
                  <p className="text-sm font-semibold">{label}</p>
                </div>
              )}
              <div className="divide-y divide-border">
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onValueChange(option.value);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-secondary/50 transition-colors flex items-center justify-between"
                  >
                    <span className="text-sm">{option.label}</span>
                    {value === option.value && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}