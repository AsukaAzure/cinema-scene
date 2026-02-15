import { cn } from "@/lib/utils";

const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface SeatGridProps {
  bookedSeats: string[];
  selectedSeats: string[];
  onToggleSeat: (seat: string) => void;
}

const SeatGrid = ({ bookedSeats, selectedSeats, onToggleSeat }: SeatGridProps) => {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Screen */}
      <div className="mb-4 w-3/4 max-w-md rounded-t-full border-b-4 border-primary/50 pb-2 text-center text-xs text-muted-foreground uppercase tracking-widest">
        Screen
      </div>

      <div className="grid gap-1.5">
        {ROWS.map((row) => (
          <div key={row} className="flex items-center gap-1.5">
            <span className="w-5 text-xs text-muted-foreground font-medium">{row}</span>
            {COLS.map((col) => {
              const seatId = `${row}${col}`;
              const isBooked = bookedSeats.includes(seatId);
              const isSelected = selectedSeats.includes(seatId);

              return (
                <button
                  key={seatId}
                  disabled={isBooked}
                  onClick={() => onToggleSeat(seatId)}
                  className={cn(
                    "h-7 w-7 rounded-t-lg text-[10px] font-medium transition-all sm:h-8 sm:w-8",
                    isBooked && "bg-seat-booked cursor-not-allowed opacity-70",
                    isSelected && "bg-seat-selected text-white shadow-lg shadow-seat-selected/30",
                    !isBooked && !isSelected && "bg-seat-available hover:bg-seat-available/80 text-background"
                  )}
                  title={seatId}
                >
                  {col}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-6 pt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded-sm bg-seat-available" /> Available
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded-sm bg-seat-selected" /> Selected
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded-sm bg-seat-booked" /> Booked
        </div>
      </div>
    </div>
  );
};

export default SeatGrid;
