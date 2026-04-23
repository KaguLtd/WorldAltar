type YearDockProps = {
  year: number;
  setYear: (year: number) => void;
};

export function YearDock({ year, setYear }: YearDockProps) {
  return (
    <section className="timeline-panel timeline-sticky">
      <div className="timeline-head">
        <p className="eyebrow">Year Dock</p>
        <strong>{year}</strong>
      </div>
      <input
        aria-label="year slider"
        className="slider"
        max={1600}
        min={1100}
        onChange={(event) => setYear(Number(event.target.value))}
        type="range"
        value={year}
      />
    </section>
  );
}
