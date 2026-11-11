"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import gsap from "gsap";
import { ArrowUpRight, Award, FileText, X } from "lucide-react";
import { useCopy, useLanguage } from "./language";
import { ReactionBar, useReactions } from "./reactions";

const certificates = [
  { id: "6734", year: 2026, title: "Praktikum Cloud-Native Application Development", titleEn: "Cloud-Native Application Development Practicum" },
  { id: "6733", year: 2026, title: "Praktikum DevOps and CI/CD Pipelines", titleEn: "DevOps and CI/CD Pipelines Practicum" },
  { id: "5235", year: 2025, title: "Praktikum Kecerdasan Buatan", titleEn: "Artificial Intelligence Practicum" },
  { id: "5234", year: 2025, title: "Praktikum Jaringan Komputer", titleEn: "Computer Networks Practicum" },
  { id: "5233", year: 2025, title: "Praktikum Pemrograman WEB", titleEn: "Web Programming Practicum" },
  { id: "4572", year: 2025, title: "Struktur Data", titleEn: "Data Structures" },
  { id: "4571", year: 2025, title: "Algoritma & Pemrograman 3", titleEn: "Algorithms & Programming 3" },
  { id: "4570", year: 2025, title: "Sistem Basis Data", titleEn: "Database Systems" },
  { id: "1514", year: 2024, title: "Praktikum Algoritma dan Pemrograman Tingkat Lanjut", titleEn: "Advanced Algorithms and Programming Practicum" },
  { id: "1086", year: 2024, title: "Praktikum Dasar Algoritma & Pemrograman", titleEn: "Fundamentals of Algorithms and Programming Practicum" },
  { id: "1085", year: 2024, title: "Command Line Linux", titleEn: "Linux Command Line" },
  { id: "175", year: 2024, title: "Dasar Javascript", titleEn: "JavaScript Fundamentals" },
] as const;

type Certificate = (typeof certificates)[number];
type YearFilter = "all" | 2026 | 2025 | 2024;

function certificateUrl(cert: Certificate, extension: "pdf" | "jpg") {
  const batch = cert.year - 1979;
  return `/certificates/Sertifikat_${cert.id}-IF-20222-A.5-II-VIII-${batch}-${cert.year}_Muhammad_Faizal.${extension}`;
}

export default function Achievements() {
  const c = useCopy();
  const language = useLanguage();
  const reactions = useReactions("certificate");
  const name = (cert: Certificate) => language === "id" ? cert.title : cert.titleEn;
  const [filter, setFilter] = useState<YearFilter>("all");
  const [selected, setSelected] = useState<Certificate | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstFilter = useRef(true);
  const visible = certificates.filter((cert) => filter === "all" || cert.year === filter);

  useEffect(() => {
    if (firstFilter.current) { firstFilter.current = false; return; }
    if (!gridRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tween = gsap.fromTo(gridRef.current.children, { opacity: 0, y: 16, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, stagger: 0.045, duration: 0.4, ease: "power2.out", clearProps: "transform,opacity" });
    return () => { tween.kill(); };
  }, [filter]);

  const close = useCallback(() => {
    if (!modalRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setSelected(null); return; }
    gsap.to(modalRef.current, { autoAlpha: 0, duration: 0.2, ease: "power2.in", onComplete: () => setSelected(null) });
  }, []);

  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("keydown", onKeyDown);
    if (modalRef.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.fromTo(modalRef.current, { opacity: 0 }, { opacity: 1, duration: 0.23 });
      gsap.fromTo(modalRef.current.querySelector(".certificate-dialog"), { y: 20, scale: 0.97 }, { y: 0, scale: 1, duration: 0.35, ease: "power3.out" });
    }
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus();
    };
  }, [selected, close]);

  return <div className="panel-inner section-panel achievements-panel">
    <div className="section-head animate-in"><p className="kicker"><span className="kicker-line" />04 / {c.achievementsPage.eyebrow}</p><h1>{c.achievementsPage.title} <em>{c.achievementsPage.titleAccent}</em></h1><p className="section-description">{c.achievementsPage.description}</p></div>
    <div className="achievements-summary animate-in"><span className="achievements-summary-icon"><Award size={24} /></span><div><strong>{certificates.length} {c.achievementsPage.certificates}</strong><span>{c.achievementsPage.education}</span></div><span className="achievements-summary-mark">✳</span></div>
    <div className="achievements-filters animate-in" role="group" aria-label={c.achievementsPage.filterLabel}>{(["all", 2026, 2025, 2024] as const).map((year) => <button key={year} type="button" className={filter === year ? "is-selected" : ""} aria-pressed={filter === year} onClick={() => setFilter(year)}>{year === "all" ? c.achievementsPage.all : year}</button>)}</div>
    <div className="achievements-grid" ref={gridRef}>{visible.map((cert) => <article className="certificate-entry animate-in" key={cert.id}><button className="certificate-card" type="button" onClick={(event) => { triggerRef.current = event.currentTarget; setSelected(cert); }} aria-label={`${c.achievementsPage.viewCertificate} ${name(cert)}`}>
      <span className="certificate-image"><Image src={certificateUrl(cert, "jpg")} alt={`${c.achievementsPage.certificateFor} ${name(cert)}`} fill sizes="(max-width: 610px) 90vw, (max-width: 1100px) 40vw, 420px" /></span>
      <span className="certificate-info"><span className="certificate-year"><Award size={13} /> {c.achievementsPage.certificate} / {cert.year}</span><strong>{name(cert)}</strong><span className="certificate-issuer">{c.achievementsPage.issuer} <ArrowUpRight size={15} /></span></span>
    </button><ReactionBar id={cert.id} item={reactions.items[cert.id]} busy={reactions.busy === cert.id} error={reactions.error === cert.id} onReact={reactions.react} /></article>)}</div>
    {selected && createPortal(<div className="certificate-overlay" ref={modalRef} onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }} role="presentation"><div className="certificate-dialog" role="dialog" aria-modal="true" aria-label={`${c.achievementsPage.certificate} ${name(selected)}`}>
      <div className="certificate-dialog-top"><div><span>{c.achievementsPage.certificate} / {selected.year}</span><strong>{name(selected)}</strong></div><a href={certificateUrl(selected, "pdf")} target="_blank" rel="noopener noreferrer"><FileText size={16} /> {c.achievementsPage.openPdf} <ArrowUpRight size={15} /></a><button type="button" ref={closeRef} onClick={close} aria-label={c.achievementsPage.close}><X size={20} /></button></div>
      <iframe src={`${certificateUrl(selected, "pdf")}#toolbar=0`} title={`${c.achievementsPage.document} ${name(selected)}`} />
    </div></div>, document.body)}
  </div>;
}
