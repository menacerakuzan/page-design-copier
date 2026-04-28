import { Link } from "react-router-dom";

type BackButtonProps = {
  to?: string;
  invert?: boolean;
};

const BackButton = ({ to = "/", invert = false }: BackButtonProps) => {
  const bg = invert ? "bg-[#9f1f47] hover:bg-[#ba2c5a]" : "bg-[#002f5e] hover:bg-[#0f3f74]";

  return (
    <Link
      to={to}
      className={`w-fit rounded-full px-5 py-2 text-[14px] leading-none tracking-[0.04em] text-[#fff2e8] transition-colors font-odesa-medium ${bg}`}
    >
      ← Назад
    </Link>
  );
};

export default BackButton;
