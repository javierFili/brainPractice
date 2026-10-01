import { Button } from '@/components/ui/Button';

export function CheckButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <div>
      <Button onClick={onClick} disabled={disabled}>
        Check answer
      </Button>
    </div>
  );
}
