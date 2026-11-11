"use client";

import gsap from "gsap";
import { ArrowUpRight, Linkedin, MessageCircle } from "lucide-react";
import { siGmail, siInstagram, siTiktok, siGithub } from "simple-icons";
import { useCopy } from "./language";

const contacts = [
  {
    name: "Gmail",
    key: "gmail",
    icon: siGmail,
    href: null,
  },
  {
    name: "Instagram",
    key: "instagram",
    icon: siInstagram,
    href: null,
  },
  {
    name: "LinkedIn",
    key: "linkedin",
    icon: null,
    href: null,
  },
  {
    name: "TikTok",
    key: "tiktok",
    icon: siTiktok,
    href: null,
  },
  {
    name: "GitHub",
    key: "github",
    icon: siGithub,
    href: "https://github.com/MhmmdFaizal04",
  },
] as const;

function animateCard(element: HTMLElement, hovering: boolean) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  gsap.to(element, { y: hovering ? -5 : 0, duration: 0.25, ease: "power2.out", overwrite: true });
}

export default function Contact({ openChat }: { openChat: () => void }) {
  const c = useCopy().contactPage;
  return <div className="panel-inner section-panel contact-panel">
    <div className="section-head animate-in"><p className="kicker"><span className="kicker-line" />08 / {c.eyebrow}</p><h1>{c.title}<span className="hero-period">.</span></h1><p className="section-description">{c.description}</p></div>
    <div className="contact-subheading animate-in">{c.social}</div>
    <div className="contact-grid">{contacts.map((contact) => <article className={`contact-card animate-in ${contact.key === "gmail" ? "contact-featured" : ""}`} key={contact.name} onMouseEnter={(event) => animateCard(event.currentTarget, true)} onMouseLeave={(event) => animateCard(event.currentTarget, false)}>
      <span className="contact-eyebrow">{contact.name.toUpperCase()}</span>
      <div className="contact-card-copy"><h2>{c[`${contact.key}Title`]}</h2><p>{c[`${contact.key}Description`]}</p></div>
      <div className="contact-card-bottom">{contact.href ? <a href={contact.href} target="_blank" rel="noopener noreferrer">{c[`${contact.key}Action`]} <ArrowUpRight size={16} /></a> : <span className="contact-coming-soon" aria-label={`${contact.name}: ${c.pending}`}>{c.pending}</span>}
        <span className="contact-brand" aria-hidden="true">{contact.icon ? <svg viewBox="0 0 24 24" fill="currentColor"><path d={contact.icon.path} /></svg> : <Linkedin size={32} strokeWidth={2.3} />}</span>
      </div>
    </article>)}</div>
    <div className="contact-chat animate-in"><div><span className="contact-chat-icon"><MessageCircle size={22} /></span><div><strong>{c.nowTitle}</strong><span>{c.nowDescription}</span></div></div><button type="button" onClick={openChat}>{c.openGuestbook} <ArrowUpRight size={16} /></button></div>
  </div>;
}
