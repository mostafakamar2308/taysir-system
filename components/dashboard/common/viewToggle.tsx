import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewToggleProps {
  view: "cards" | "table";
  onViewChange: (view: "cards" | "table") => void;
}

const ViewToggle = ({ view, onViewChange }: ViewToggleProps) => {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
      <Button
        variant={view === "cards" ? "default" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => onViewChange("cards")}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={view === "table" ? "default" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => onViewChange("table")}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ViewToggle;
