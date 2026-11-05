// A soft fade between pages. Opacity only, so fixed and sticky elements inside pages keep working.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
