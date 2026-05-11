import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-[#002f5e] text-[#fff2e8]">
    <p className="text-[120px] leading-none font-odesa-medium">404</p>
    <p className="mt-4 text-[28px] leading-none font-odesa-regular">Сторінку не знайдено</p>
    <Link
      to="/"
      className="mt-10 rounded-full bg-[#9f1f47] px-8 py-3 text-[18px] leading-none text-[#fff2e8] transition-colors hover:bg-[#ba2c5a] font-odesa-medium"
    >
      На головну
    </Link>
  </div>
);

export default NotFound;
