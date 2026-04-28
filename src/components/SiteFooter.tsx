import { Facebook, Instagram } from "lucide-react";

const footerColumns = [
  {
    title: "Мандрівнику",
    links: ["Що подивитись", "Куди поїхати", "Маршрути", "Події", "Інформація"],
  },
  {
    title: "Медіа",
    links: ["Новини", "Фото та відео", "Контакти", "Логотипи"],
  },
];

const TikTokIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M14 3c.3 1.6 1.5 2.9 3 3.3V9a7 7 0 0 1-3-1v6.2a5.2 5.2 0 1 1-5.2-5.2h.2v2.8h-.2a2.4 2.4 0 1 0 2.4 2.4V3h2.8z" />
  </svg>
);

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/odesa_travel/", Icon: Instagram },
  { label: "TikTok", href: "https://www.tiktok.com/@odesa.travel", Icon: TikTokIcon },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61573965222850&mibextid=wwXIfr&rdid=bBZVa5vEkPiFA5UM&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1Eupy1CSJE%2F%3Fmibextid%3DwwXIfr%26utm_source%3Dig%26utm_medium%3Dsocial%26utm_content%3Dlink_in_bio#",
    Icon: Facebook,
  },
];

const SiteFooter = () => {
  return (
    <footer className="relative z-10 bg-[#fff2e8] px-4 py-16 text-[#002f5e] md:px-10">
      <div className="mx-auto grid max-w-[1200px] gap-7 border-t border-[#002f5e]/20 pt-10 md:grid-cols-[1fr_1fr_auto]">
        {footerColumns.map((col) => (
          <div key={col.title}>
            <h4 className="text-[30px] leading-none font-odesa-medium">{col.title}</h4>
            <nav className="mt-4 space-y-3">
              {col.links.map((link) => (
                <a key={link} href="#" className="block text-[20px] leading-none text-[#002f5e]/82 transition-colors hover:text-[#002f5e] font-odesa-regular">
                  {link}
                </a>
              ))}
            </nav>
          </div>
        ))}

        <div>
          <h4 className="text-[30px] leading-none text-[#002f5e]/70 font-odesa-medium">Зв'язок</h4>
          <div className="mt-4 flex items-center gap-2">
            {socialLinks.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#002f5e]/30 text-[#002f5e] transition-colors hover:bg-[#002f5e] hover:text-[#fff2e8]"
                aria-label={label}
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
