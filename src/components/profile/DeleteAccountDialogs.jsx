import React, { useState } from "react";
import { AlertTriangle, Loader2, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DeleteAccountDialogs({ onConfirmDelete, isDeleting }) {
  const [stage, setStage] = useState(null);
  const [confirmationText, setConfirmationText] = useState("");

  const reset = () => {
    setStage(null);
    setConfirmationText("");
  };

  const handleFinalDelete = async () => {
    await onConfirmDelete(confirmationText);
    reset();
  };

  return (
    <>
      <Button
        variant="ghost"
        className="w-full text-destructive hover:bg-destructive/10 select-none"
        onClick={() => setStage("review")}
      >
        <UserX className="w-4 h-4 mr-2" />
        Delete Account
      </Button>

      <AlertDialog open={stage === "review"} onOpenChange={(open) => !open && reset()}>
        <AlertDialogContent className="max-w-sm rounded-[28px] border-0 bg-card/95 p-6 shadow-2xl backdrop-blur-xl">
          <AlertDialogHeader className="text-left">
            <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl font-semibold">Delete Account</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
              Deleting your account permanently removes your profile, rides, messages, and stored app data from RideRadar.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-2xl bg-secondary/50 p-4 text-sm text-foreground">
            <ul className="space-y-2 text-sm leading-5">
              <li>• Your profile and photo</li>
              <li>• Ride history and participation</li>
              <li>• Messages and notifications</li>
              <li>• Any saved blocking records</li>
            </ul>
          </div>

          <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
            <Button variant="outline" className="w-full rounded-2xl" onClick={reset}>
              Keep Account
            </Button>
            <Button className="w-full rounded-2xl" variant="destructive" onClick={() => setStage("confirm") }>
              Continue
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={stage === "confirm"} onOpenChange={(open) => !open && reset()}>
        <AlertDialogContent className="max-w-sm rounded-[28px] border-0 bg-card/95 p-6 shadow-2xl backdrop-blur-xl">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-xl font-semibold">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
              Type <span className="font-semibold text-foreground">DELETE</span> to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Input
            autoFocus
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value.toUpperCase())}
            placeholder="Type DELETE"
            className="h-11 rounded-2xl bg-secondary/60"
          />

          <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
            <Button variant="outline" className="w-full rounded-2xl" onClick={() => setStage("review")}>
              Back
            </Button>
            <Button
              className="w-full rounded-2xl"
              variant="destructive"
              disabled={confirmationText !== "DELETE"}
              onClick={() => setStage("final")}
            >
              Continue
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={stage === "final"} onOpenChange={(open) => !open && reset()}>
        <AlertDialogContent className="max-w-sm rounded-[28px] border-0 bg-card/95 p-6 shadow-2xl backdrop-blur-xl">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-xl font-semibold">Final Confirmation</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
              This action cannot be undone. Your account will be deleted immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
            <Button variant="outline" className="w-full rounded-2xl" onClick={reset} disabled={isDeleting}>
              Cancel
            </Button>
            <Button className="w-full rounded-2xl" variant="destructive" onClick={handleFinalDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Account"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}