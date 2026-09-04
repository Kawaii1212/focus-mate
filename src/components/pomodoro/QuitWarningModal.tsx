import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface QuitWarningModalProps {
  open: boolean;
  completionPct: number;
  onKeepStudying: () => void;
  onEndAnyway: () => void;
}

export default function QuitWarningModal({
  open,
  completionPct,
  onKeepStudying,
  onEndAnyway,
}: QuitWarningModalProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">Kết thúc sớm?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              Bạn mới hoàn thành{' '}
              <strong className="text-foreground">{Math.round(completionPct)}%</strong> thời lượng đã
              đặt.
            </span>
            <span className="block">
              Kết thúc sớm sẽ giảm reward và streak hôm nay sẽ{' '}
              <strong className="text-destructive">không được tính</strong>. Mascot cũng sẽ buồn
              một chút!
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onKeepStudying} className="rounded-xl">
            Tiếp tục học
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onEndAnyway}
            className="rounded-xl"
            style={{ background: 'hsl(var(--destructive))', color: 'white' }}
          >
            Kết thúc dù sao
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
