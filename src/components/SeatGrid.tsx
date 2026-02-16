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
    <div className="flex flex-col items-center gap-6">
      {/* Screen */}
      <div className="relative mb-2 w-4/5 max-w-sm">
        <div className="h-1 rounded-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <p className="mt-2 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Screen</p>
      </div>

      <div className="grid gap-1.5 sm:gap-2">
        {ROWS.map((row) => (
          <div key={row} className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-5 text-center text-xs font-medium text-muted-foreground">{row}</span>
            {COLS.map((col) => {
              const seatId = `${row}${col}`;
              const isBooked = bookedSeats.includes(seatId);
              const isSelected = selectedSeats.includes(seatId);

              // Add aisle gap after column 5
              const isAfterAisle = col === 6;

              return (
                <button
                  key={seatId}
                  disabled={isBooked}
                  onClick={() => onToggleSeat(seatId)}
                  className={cn(
                    "h-7 w-7 rounded-t-lg text-[10px] font-medium transition-all duration-200 sm:h-8 sm:w-8",
                    isAfterAisle && "ml-3 sm:ml-4",
                    isBooked && "bg-seat-booked/30 cursor-not-allowed border border-seat-booked/20",
                    isSelected && "bg-seat-selected text-primary-foreground shadow-lg shadow-primary/25 scale-105",
                    !isBooked && !isSelected && "bg-secondary hover:bg-secondary/70 hover:scale-105 text-muted-foreground border border-border/50"
                  )}
                  title={seatId}
                >
                  {col}
                </button>
              );
            })}
            <span className="w-5 text-center text-xs font-medium text-muted-foreground">{row}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 pt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-sm bg-secondary border border-border/50" /> Available
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-sm bg-seat-selected shadow-sm shadow-primary/20" /> Selected
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-sm bg-seat-booked/30 border border-seat-booked/20" /> Booked
        </div>
      </div>
    </div>
  );
};

export default SeatGrid;
