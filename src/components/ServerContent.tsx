import Link from "next/link";
import { site, salonDetails } from "@/config/site";
import { styles } from "@/data/styles";
import { stylists } from "@/data/stylists";
import { menus } from "@/data/menu";
import { colorById } from "@/data/hairStyles";
import { pageInfo } from "@/lib/seo";
import s from "./experience.module.css";
export function ServerContent({ path }: { path: string }) {
  const info = pageInfo(path);
  return (
    <section className={`${s.contentPage} server-content`}>
      <p className={s.eyebrow}>{site.name} / HAIR DESIGN STUDIO</p>
      <h1>{info.label}</h1>
      <p>{info.description}</p>
      {info.style && (
        <>
          <p>
            STYLIST /{" "}
            {stylists.find((p) => p.id === info.style!.stylistId)?.name}
          </p>
          <p>COLOR / {colorById(info.style.defaultColor).name}</p>
          <p>
            ESTIMATE / ¥{info.style.estimatedPriceFrom.toLocaleString("ja-JP")}
            〜（指名料別・参考価格）
          </p>
          <p>
            {info.style.estimatedTimeMin}〜{info.style.estimatedTimeMax} MIN
          </p>
          <Link
            href={`/color?style=${info.style.slug}&color=${info.style.defaultColor}`}
          >
            このスタイルのカラーを比較する →
          </Link>
        </>
      )}
      {path === "/style" && (
        <ul>
          {styles.map((style) => (
            <li key={style.id}>
              <Link href={`/style/${style.slug}`}>{style.name}</Link> —{" "}
              {style.description}
            </li>
          ))}
        </ul>
      )}
      {(path === "/stylist" || info.person) && (
        <ul>
          {(info.person ? [info.person] : stylists).map((person) => (
            <li key={person.id}>
              <Link href={`/stylist/${person.slug}`}>{person.name}</Link> —{" "}
              {person.specialties.join(" / ")}
            </li>
          ))}
        </ul>
      )}
      {path === "/menu" && (
        <dl>
          {menus.map((menu) => (
            <div key={menu.id}>
              <dt>{menu.name}</dt>
              <dd>
                ¥{menu.priceFrom.toLocaleString("ja-JP")}〜 / {menu.durationMin}{" "}
                MIN
              </dd>
            </div>
          ))}
        </dl>
      )}
      {path === "/salon" && (
        <dl>
          {salonDetails.map(([name, value]) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <nav aria-label="サイト内リンク">
        <Link href="/style">STYLE</Link>
        <Link href="/stylist">STYLIST</Link>
        <Link href="/menu">MENU</Link>
        <Link href="/salon">SALON</Link>
        <Link href="/booking">BOOK</Link>
      </nav>
      <noscript>
        <p>
          カラー比較にはJavaScriptを有効にしてください。店舗情報・メニューはこのまま確認できます。
        </p>
        {site.lineUrl && (
          <a href={site.lineUrl} rel="noopener noreferrer">
            LINEで予約
          </a>
        )}
        {site.webUrl && (
          <a href={site.webUrl} rel="noopener noreferrer">
            WEBで予約
          </a>
        )}
      </noscript>
    </section>
  );
}
