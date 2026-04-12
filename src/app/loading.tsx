export default function GlobalLoading() {
  return (
    <div className="min-h-[40vh] w-full bg-white pt-28">
      <div className="mx-auto w-full max-w-7xl px-6 py-10 md:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-3 w-40 bg-black/10" />
          <div className="h-9 w-96 max-w-full bg-black/10" />
          <div className="h-4 w-full max-w-3xl bg-black/10" />
          <div className="h-4 w-11/12 max-w-3xl bg-black/10" />
        </div>
      </div>
    </div>
  );
}
