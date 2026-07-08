export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <svg
        className="h-10 w-10 animate-spin text-cyan-400"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
        />
      </svg>
    </div>
  );
}
