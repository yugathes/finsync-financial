import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onClick: () => void;
}

export const FloatingActionButton = ({ onClick }: FloatingActionButtonProps) => {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-elevation bg-gradient-primary hover:shadow-primary transition-smooth z-40 sm:hidden"
      size="icon"
    >
      <Plus className="h-6 w-6 text-white" />
    </Button>
  );
};