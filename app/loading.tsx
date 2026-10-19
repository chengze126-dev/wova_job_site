export default function Loading() {
  return (
    <div className="min-h-[100svh] bg-[#000508] text-white">
      <div className="mx-auto w-[92%] max-w-[1308px] pt-5">
        <div className="flex h-[58px] items-center lg:h-[66px]">
          <div className="h-9 w-28 rounded-md bg-white/10" />
          <div className="ml-auto h-9 w-24 rounded-md bg-white/10" />
        </div>
        <div className="mt-10 max-w-[738px] lg:mt-14">
          <div className="h-[52px] w-[min(100%,420px)] rounded-lg bg-white/12 sm:h-[64px]" />
          <div className="mt-3 h-[36px] w-[min(70%,280px)] rounded-lg bg-[#08b84f]/35" />
          <div className="mt-5 h-4 w-[min(90%,360px)] rounded bg-white/10" />
          <div className="mt-8 h-[62px] w-full rounded-[10px] bg-white" />
        </div>
      </div>
    </div>
  );
}
