import Link from "next/link";
import Image from "next/image";
import logoMark from "../../public/logo-mark.png";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2">
      <Image
        src={logoMark}
        alt=""
        className="h-8 w-auto"
        priority
      />
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        Clubin Tickets
      </span>
    </Link>
  );
}
