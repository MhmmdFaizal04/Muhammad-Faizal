"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import gsap from "gsap";
import Image from "next/image";
import CustomCursor from "./custom-cursor";
import Achievements from "./achievements";
import Contact from "./contact";
import { copy, LanguageContext, useCopy, useLanguage, type Language } from "./language";
import { ReactionBar, useReactions } from "./reactions";
import pusatPreview from "../../image.png";
import underspecPreview from "../../image1.png";
import { siJavascript, siTypescript, siPython, siHtml5, siCss, siReact, siNextdotjs, siNodedotjs } from "simple-icons";
import {
  ArrowRight, ArrowUpRight, BriefcaseBusiness,
  ChevronRight, Code2, Command,
  Github, House, Layers3, MapPin, Gamepad2, Activity, Clock3, Eye,
  Menu, MessageCircle, Send, ShieldCheck, Sparkles, UserRound, Wrench, X, Award, BadgeCheck,
} from "lucide-react";

const tabs = ["home", "skills", "experiences", "achievements", "projects", "github", "chat", "contact"] as const;
type Tab = (typeof tabs)[number];

const navigation = [
  { id: "home", icon: House },
  { id: "skills", icon: Wrench },
  { id: "experiences", icon: BriefcaseBusiness },
  { id: "achievements", icon: Award },
  { id: "projects", icon: Layers3 },
  { id: "github", icon: Github },
  { id: "chat", icon: MessageCircle },
  { id: "contact", icon: UserRound },
] as const;

type Repository = { name: string; description: string | null; html_url: string; language: string | null; stargazers_count: number; updated_at: string; fork: boolean };
type GithubData = {
  profile: { login: string; name: string | null; bio: string | null; location: string | null; public_repos: number; followers: number; html_url: string };
  repos: Repository[];
  contributions: { total: number; days: { date: string; count: number; level: number }[] } | null;
  updatedAt: string;
};
type ChatMessage = { id: number; username: string; body: string; created_at: string; mine?: boolean };

function animateHover(event: React.MouseEvent<HTMLElement>, hovering: boolean) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  gsap.to(event.currentTarget, { y: hovering ? -3 : 0, duration: 0.25, ease: "power2.out", overwrite: true });
}

function animateSidebarIcon(button: HTMLButtonElement, hovering: boolean) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const icon = button.querySelector<SVGSVGElement>(".nav-icon");
  if (!icon) return;
  gsap.killTweensOf(icon);
  if (hovering) {
    gsap.timeline()
      .to(icon, { y: -4, rotation: -13, scale: 1.2, color: "var(--mint)", duration: 0.2, ease: "power2.out" })
      .to(icon, { y: -1, rotation: 5, scale: 1.08, duration: 0.27, ease: "back.out(2)" });
  } else {
    gsap.to(icon, { y: 0, rotation: 0, scale: 1, duration: 0.26, ease: "power2.out", onComplete: () => gsap.set(icon, { clearProps: "transform,color" }) });
  }
}

function Kicker({ children }: { children: ReactNode }) {
  return <p className="kicker"><span className="kicker-line" />{children}</p>;
}

function SectionHead({ number, eyebrow, title, description }: { number: string; eyebrow: string; title: ReactNode; description: string }) {
  return (
    <div className="section-head animate-in">
      <Kicker>{number} / {eyebrow}</Kicker>
      <h1>{title}</h1>
      <p className="section-description">{description}</p>
    </div>
  );
}

function LoadingCard({ label }: { label: string }) {
  return <div className="state-card animate-in"><span className="loading-dot" />{label}</div>;
}

function HomePanel({ navigate }: { navigate: (tab: Tab) => void }) {
  const c = useCopy();
  return (
    <div className="panel-inner home-panel">
      <div className="home-copy">
        <div className="animate-in"><Kicker>{c.home.eyebrow}</Kicker></div>
        <div className="availability animate-in"><span className="availability-dot" /> {c.home.available} <Sparkles size={13} /></div>
        <h1 className="hero-title animate-in">{c.home.greeting}<br /><span>Muhammad</span><br /><span>Faizal<span className="hero-period">.</span></span></h1>
        <p className="hero-description animate-in">{c.home.description}</p>
        <div className="hero-actions animate-in">
          <button className="button-primary" onClick={() => navigate("projects")} onMouseEnter={(e) => animateHover(e, true)} onMouseLeave={(e) => animateHover(e, false)}>{c.home.projects} <ArrowUpRight size={17} /></button>
          <button className="button-quiet" onClick={() => navigate("chat")}>{c.home.chat} <ArrowRight size={16} /></button>
        </div>
      </div>
      <div className="hero-art animate-in" aria-label={c.common.photoPlaceholder}>
        <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
        <div className="art-star art-star-top">✳</div><div className="art-star art-star-bottom">✳</div>
        <div className="portrait-placeholder"><div className="portrait-grid" /><span className="portrait-monogram">MF<span>.</span></span><span className="portrait-note">{c.home.photoTop}<br />{c.home.photoBottom}</span></div>
      </div>
    </div>
  );
}

const skills = [
  { icon: Code2, number: "01", title: "webTitle", text: "webText", tags: ["tagWeb", "tagDevelopment"], className: "skill-featured" },
  { icon: Layers3, number: "02", title: "creativeTitle", text: "creativeText", tags: ["tagCreative", "tagDigital"], className: "" },
  { icon: Sparkles, number: "03", title: "editingTitle", text: "editingText", tags: ["tagEditing", "tagContent"], className: "" },
] as const;

const technologies = [
  { icon: siJavascript, label: "JavaScript", kind: "language", color: "#C3F677" },
  { icon: siTypescript, label: "TypeScript", kind: "language", color: "#9BCC84" },
  { icon: siPython, label: "Python", kind: "language", color: "#ACD895" },
  { icon: siHtml5, label: "HTML5", kind: "markup", color: "#BCE49B" },
  { icon: siCss, label: "CSS", kind: "styling", color: "#87BD7C" },
  { icon: siReact, label: "React", kind: "library", color: "#A0D38D" },
  { icon: siNextdotjs, label: "Next.js", kind: "framework", color: "#D5DED3" },
  { icon: siNodedotjs, label: "Node.js", kind: "runtime", color: "#A7D682" },
] as const;

function SkillShuffle() {
  const c = useCopy();
  const [index, setIndex] = useState(0);
  const locked = useRef(false);
  const mounted = useRef(false);
  const deckRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    if (!deckRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { locked.current = false; return; }
    const cards = deckRef.current.querySelectorAll(".shuffle-card");
    const tween = gsap.fromTo(cards, { opacity: 0, x: -34, y: 20, scale: 0.94 }, { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.55, stagger: 0.08, ease: "back.out(1.4)", onComplete: () => { locked.current = false; } });
    return () => { tween.kill(); locked.current = false; };
  }, [index]);

  function shuffle() {
    if (locked.current) return;
    locked.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setIndex((current) => (current + 1) % technologies.length); return; }
    const front = deckRef.current?.querySelector(".shuffle-card-front");
    if (!front) { locked.current = false; return; }
    gsap.to(front, { x: 165, y: -20, rotation: 13, opacity: 0, duration: 0.34, ease: "power2.in", onComplete: () => setIndex((current) => (current + 1) % technologies.length) });
  }

  return <div className="skill-explorer animate-in">
    <div className="skill-explorer-copy"><Kicker>{c.skills.shuffleEyebrow}</Kicker><h2>{c.skills.shuffleTitle}<br /><span>{c.skills.shuffleAccent}</span></h2><p>{c.skills.shuffleDescription}</p><div className="shuffle-pagination"><span>{String(index + 1).padStart(2, "0")}</span> / {String(technologies.length).padStart(2, "0")} <ArrowRight size={17} /></div></div>
    <div className="shuffle-deck" ref={deckRef} aria-label={c.skills.shuffleAria}>{[2, 1, 0].map((depth) => {
      const technology = technologies[(index + depth) % technologies.length];
      return <button key={technology.label} type="button" className={`shuffle-card ${depth === 0 ? "shuffle-card-front" : ""}`} style={{ top: depth * 11, left: depth * 13, zIndex: 3 - depth, rotate: `${depth * -3}deg` }} onClick={shuffle} aria-label={`${c.skills.shuffleButton} ${technology.label}`}>
        <span className="shuffle-card-top"><span>{c.skills.skillLabel} / {String((index + depth) % technologies.length + 1).padStart(2, "0")}</span><ArrowUpRight size={18} /></span>
        <span className="technology-logo" style={{ color: technology.color }}><svg viewBox="0 0 24 24" role="img" aria-label={`${technology.label} logo`}><path fill="currentColor" d={technology.icon.path} /></svg></span>
        <span className="shuffle-card-bottom"><span><strong>{technology.label}</strong><small>{c.skills[technology.kind]}</small></span><span className="shuffle-card-next"><ArrowRight size={19} /></span></span>
      </button>;
    })}</div>
  </div>;
}

function SkillsPanel() {
  const c = useCopy();
  return <div className="panel-inner section-panel">
    <SectionHead number="02" eyebrow={c.skills.eyebrow} title={<>{c.skills.title} <em>{c.skills.titleAccent}</em></>} description={c.skills.description} />
    <SkillShuffle />
    <div className="skills-grid">{skills.map(({ icon: Icon, number, title, text, tags, className }) => <article className={`skill-card animate-in ${className}`} key={title}>
      <div className="skill-card-top"><span className="skill-icon"><Icon size={23} strokeWidth={1.7} /></span><span className="card-number">/ {number}</span></div>
      <div><h2>{c.skills[title]}</h2><p>{c.skills[text]}</p></div><div className="tag-row">{tags.map((tag) => <span className="tag" key={tag}>{c.skills[tag]}</span>)}</div>
    </article>)}</div>
    <div className="note-bar animate-in"><span className="note-icon"><Command size={19} /></span><span>{c.skills.note}</span><span className="note-end">{c.skills.more} <ArrowUpRight size={14} /></span></div>
  </div>;
}

function ExperiencesPanel() {
  const c = useCopy();
  return <div className="panel-inner section-panel">
    <SectionHead number="03" eyebrow={c.experiences.eyebrow} title={<>{c.experiences.title} <em>{c.experiences.titleAccent}</em></>} description={c.experiences.description} />
    <div className="timeline">
      <div className="timeline-entry animate-in"><div className="timeline-marker" /><div className="timeline-date">{c.experiences.current}</div><div className="timeline-content"><span className="entry-category">{c.experiences.whatIDo}</span><h2>{c.experiences.freelanceTitle}</h2><p>{c.experiences.freelanceText}</p><span className="entry-pill"><span /> {c.experiences.ongoing}</span></div></div>
      <div className="timeline-entry animate-in"><div className="timeline-marker" /><div className="timeline-date">{c.experiences.education}</div><div className="timeline-content"><span className="entry-category">{c.experiences.learning}</span><h2>Universitas Muhammadiyah Makassar</h2><p>{c.experiences.universityText}</p></div></div>
    </div>
    <div className="experience-footer animate-in"><span>{c.experiences.footer}</span><Sparkles size={17} /></div>
  </div>;
}

function useGithub(enabled: boolean) {
  const [data, setData] = useState<GithubData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!enabled || data) return;
    const controller = new AbortController();
    async function load() {
      for (const url of ["/api/github", "/github-snapshot.json"]) {
        try {
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) continue;
          const result = await response.json() as GithubData;
          if (result.profile?.login !== "MhmmdFaizal04" || !result.contributions?.days?.length) continue;
          setData(result);
          setError(false);
          return;
        } catch { if (controller.signal.aborted) return; }
      }
      if (!controller.signal.aborted) setError(true);
    }
    void load().finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [enabled, data]);
  return { data, error, loading };
}

const featuredProjects = [
  { id: "pusat-mlbb", name: "PusatMLBB", url: "https://pusat-mlbb.vercel.app/", category: "commerce", description: "firstDescription", icon: Gamepad2, preview: pusatPreview },
  { id: "underspec-sulbagsel", name: "Monitoring UNSPEC Sulbagsel", url: "https://underspec-sulbagsel.vercel.app/", category: "dashboard", description: "secondDescription", icon: Activity, preview: underspecPreview },
] as const;

function ProjectsPanel() {
  const c = useCopy();
  const reactions = useReactions("project");
  return <div className="panel-inner section-panel">
    <SectionHead number="05" eyebrow={c.projects.eyebrow} title={<>{c.projects.title} <em>{c.projects.titleAccent}</em></>} description={c.projects.description} />
    <div className="projects-grid">{featuredProjects.map((project, index) => <article className="project-card project-browser animate-in" key={project.name}>
      <div className="project-browser-bar"><span className="browser-dots"><i /><i /><i /></span><span className="browser-address">{new URL(project.url).hostname}</span><a href={project.url} target="_blank" rel="noopener noreferrer" aria-label={`${c.projects.newTab}: ${project.name}`}><ArrowUpRight size={16} /></a></div>
      <a className="project-webview" href={project.url} target="_blank" rel="noopener noreferrer" aria-label={`${c.projects.visit}: ${project.name}`} onMouseEnter={(event) => { if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) gsap.to(event.currentTarget.querySelector("img"), { scale: 1.045, duration: 0.4, ease: "power2.out" }); }} onMouseLeave={(event) => { gsap.to(event.currentTarget.querySelector("img"), { scale: 1, duration: 0.4, ease: "power2.out" }); }}><Image src={project.preview} alt={`${c.projects.preview}: ${project.name}`} fill sizes="(max-width: 610px) 90vw, (max-width: 1100px) 40vw, 420px" placeholder="blur" /></a>
      <div className="project-browser-info"><div className="project-top"><span className="project-index">{c.projects.projectLabel} / {String(index + 1).padStart(2, "0")}</span><span className="project-symbol"><project.icon size={21} strokeWidth={1.6} /></span></div><h2>{project.name}</h2><p>{c.projects[project.description]}</p><div className="project-meta"><span>{c.projects[project.category]}</span><a href={project.url} target="_blank" rel="noopener noreferrer">{c.projects.live} <ArrowUpRight size={14} /></a></div></div>
      <ReactionBar id={project.id} item={reactions.items[project.id]} busy={reactions.busy === project.id} error={reactions.error === project.id} onReact={reactions.react} />
    </article>)}</div>
    <div className="note-bar animate-in"><span className="note-icon"><Sparkles size={19} /></span><span>{c.projects.note}</span></div>
  </div>;
}

function useCodingTime(enabled: boolean) {
  const [codingTime, setCodingTime] = useState<{ hours: number | null; period: "all_time" | "today" | null }>({ hours: null, period: null });
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    function refresh() {
      fetch("/api/coding-time", { signal: controller.signal, cache: "no-store" }).then(async (response) => {
        if (!response.ok) throw new Error("Coding time unavailable");
        return response.json() as Promise<{ hours: number | null; period: "all_time" | "today" | null }>;
      }).then((result) => { if (!controller.signal.aborted) setCodingTime(result); }).catch(() => {});
    }
    refresh();
    const interval = window.setInterval(() => { if (!document.hidden) refresh(); }, 120_000);
    const onVisible = () => { if (!document.hidden) refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { controller.abort(); window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, [enabled]);
  return codingTime;
}

function ContributionTrend({ days }: { days: { date: string; count: number }[] }) {
  const c = useCopy();
  const pathRef = useRef<SVGPathElement>(null);
  const recent = days.slice(-84);
  const weeks = Array.from({ length: 12 }, (_, week) => recent.slice(week * 7, (week + 1) * 7).reduce((sum, day) => sum + day.count, 0));
  const maximum = Math.max(1, ...weeks);
  const coordinates = weeks.map((count, index) => `${8 + index * 54.7},${119 - (count / maximum) * 97}`);
  const line = `M ${coordinates.join(" L ")}`;
  const area = `${line} L 609.7,125 L 8,125 Z`;

  useEffect(() => {
    const path = pathRef.current;
    if (!path || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const length = path.getTotalLength();
    const tween = gsap.fromTo(path, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: 1.6, ease: "power2.out" });
    return () => { tween.kill(); };
  }, [days]);

  return <div className="trend-card animate-in"><div className="calendar-heading"><div><span className="tiny-label">{c.githubPage.weeks}</span><h2>{c.githubPage.activity}</h2></div><Activity size={20} /></div><p className="trend-description">{c.githubPage.trendDescription}</p><svg viewBox="0 0 620 143" preserveAspectRatio="none" role="img" aria-label={`${c.githubPage.trendAria}: ${weeks.join(", ")} ${c.githubPage.perWeek}`}>
    <defs><linearGradient id="trend-gradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#c3f677" stopOpacity=".27" /><stop offset="1" stopColor="#c3f677" stopOpacity="0" /></linearGradient></defs>
    <path d={area} fill="url(#trend-gradient)" /><path d={line} ref={pathRef} fill="none" stroke="#c3f677" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg><div className="trend-axis"><span>{c.githubPage.weeksAgo}</span><span>{c.githubPage.thisWeek}</span></div></div>;
}

function GithubPanel({ github }: { github: ReturnType<typeof useGithub> }) {
  const c = useCopy();
  const language = useLanguage();
  const calendarRef = useRef<HTMLDivElement>(null);
  const codingTime = useCodingTime(true);
  useEffect(() => {
    if (!github.data?.contributions || !calendarRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tween = gsap.fromTo(calendarRef.current.querySelectorAll(".contribution-day[data-level]:not([data-level='0'])"), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.004, duration: 0.3, ease: "back.out(1.6)" });
    return () => { tween.kill(); };
  }, [github.data]);
  const data = github.data;
  return <div className="panel-inner section-panel">
    <SectionHead number="06" eyebrow={c.githubPage.eyebrow} title={<>{c.githubPage.title} <em>{c.githubPage.titleAccent}</em></>} description={c.githubPage.description} />
    {github.loading && <LoadingCard label={c.githubPage.loading} />}
    {github.error && <div className="state-card animate-in">{c.githubPage.unavailable} <a href="https://github.com/MhmmdFaizal04" target="_blank" rel="noopener noreferrer">{c.githubPage.visitProfile} <ArrowUpRight size={15} /></a></div>}
    {data && <>
      <div className="github-profile animate-in"><div className="github-avatar"><Github size={30} /></div><div className="github-identity"><span className="tiny-label">{c.githubPage.profile}</span><h2>@{data.profile.login}</h2><p>{data.profile.bio || c.githubPage.defaultBio}</p></div><a className="icon-link" href={data.profile.html_url} target="_blank" rel="noopener noreferrer" aria-label={c.githubPage.profileAria}><ArrowUpRight size={20} /></a></div>
      <div className="github-stats"><div className="stat-card animate-in"><span>{c.githubPage.repos}</span><strong>{data.profile.public_repos}</strong><span className="stat-icon"><Code2 size={18} /></span></div><div className="stat-card animate-in"><span>{c.githubPage.followers}</span><strong>{data.profile.followers}</strong><span className="stat-icon"><UserRound size={18} /></span></div><div className="stat-card animate-in"><span>{c.githubPage.yearlyContributions}</span><strong>{data.contributions?.total ?? "—"}</strong><span className="stat-icon"><Sparkles size={18} /></span></div><div className="stat-card animate-in"><span>{codingTime.period === "today" ? c.githubPage.hoursToday : c.githubPage.hoursRecorded}</span><strong>{codingTime.hours === null ? "—" : `${codingTime.hours}h`}</strong><span className="stat-icon"><Clock3 size={18} /></span><small>{codingTime.hours === null ? c.githubPage.noWakatime : codingTime.period === "today" ? c.githubPage.wakatimeToday : c.githubPage.wakatimeAll}</small></div></div>
      {data.contributions && <ContributionTrend days={data.contributions.days} />}
      <div className="calendar-card animate-in"><div className="calendar-heading"><div><span className="tiny-label">{c.githubPage.yourActivity}</span><h2>{c.githubPage.graph}</h2></div><Github size={20} /></div>
        {data.contributions ? <div className="calendar-scroll"><div className="calendar-grid" ref={calendarRef} aria-label={`${c.githubPage.graphAria}: ${data.contributions.total} ${c.githubPage.contributionsYear}`}>{data.contributions.days.map((day) => <span className="contribution-day" data-level={day.level} key={day.date} title={`${day.date}: ${day.count} ${c.githubPage.contribution}`} />)}</div></div> : <p className="calendar-unavailable">{c.githubPage.calendarUnavailable}</p>}
        <div className="calendar-bottom"><span>{c.githubPage.lastUpdated} {new Date(data.updatedAt).toLocaleDateString(language === "id" ? "id-ID" : "en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()}</span><span className="calendar-legend">{c.githubPage.less} <i data-level="0" /><i data-level="1" /><i data-level="2" /><i data-level="3" /><i data-level="4" /> {c.githubPage.more}</span></div>
      </div>
      <a className="github-visit animate-in" href={data.profile.html_url} target="_blank" rel="noopener noreferrer">{c.githubPage.visit} <ArrowUpRight size={18} /></a>
    </>}
  </div>;
}

function ChatPanel() {
  const c = useCopy();
  const language = useLanguage();
  const [username, setUsername] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<"" | "updateFailed" | "unavailable" | "joinFailed" | "sendFailed" | "invalidUsername" | "invalidMessage" | "rateLimited">("");
  const [busy, setBusy] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [visitors, setVisitors] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastId = useRef(0);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    async function loadVisitors() {
      try {
        const response = await fetch("/api/visitors", { cache: "no-store" });
        if (!response.ok) return;
        const result = await response.json() as { visitors: number };
        if (active && Number.isSafeInteger(result.visitors)) setVisitors(result.visitors);
      } catch { /* The counter is available when Pages Functions are running. */ }
    }
    const first = window.setTimeout(() => { void loadVisitors(); }, 800);
    const interval = window.setInterval(() => { if (!document.hidden) void loadVisitors(); }, 30_000);
    return () => { active = false; window.clearTimeout(first); window.clearInterval(interval); };
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/messages?after=${lastId.current}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load messages");
      const incoming = await response.json() as ChatMessage[];
      if (incoming.length) {
        lastId.current = incoming[incoming.length - 1].id;
        setMessages((current) => [...current, ...incoming].slice(-100));
        setStatus("");
      }
    } catch { setStatus("updateFailed"); }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch("/api/chat/session", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("Service unavailable");
      return response.json() as Promise<{ username: string | null }>;
    }).then((result) => { if (mounted) setUsername(result.username); }).catch(() => { if (mounted) setStatus("unavailable"); }).finally(() => { if (mounted) setInitializing(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!username) return;
    void loadMessages();
    const timer = window.setInterval(() => { if (!document.hidden) void loadMessages(); }, 4000);
    return () => window.clearInterval(timer);
  }, [username, loadMessages]);

  useEffect(() => {
    if (!messages.length) return;
    bottomRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "end" });
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const last = messagesRef.current?.querySelector(".chat-message:last-of-type");
      if (last) gsap.fromTo(last, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" });
    }
  }, [messages]);

  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus("");
    try {
      const response = await fetch("/api/chat/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: nameInput.trim() }) });
      const result = await response.json() as { username?: string };
      if (!response.ok || !result.username) { setStatus(response.status === 400 ? "invalidUsername" : "joinFailed"); return; }
      setUsername(result.username);
    } catch { setStatus("joinFailed"); }
    finally { setBusy(false); }
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true); setStatus("");
    try {
      const response = await fetch("/api/chat/messages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body }) });
      if (!response.ok) { setStatus(response.status === 429 ? "rateLimited" : response.status === 400 ? "invalidMessage" : "sendFailed"); return; }
      setText(""); await loadMessages();
    } catch { setStatus("sendFailed"); }
    finally { setBusy(false); }
  }

  return <div className="panel-inner section-panel chat-panel">
    <SectionHead number="07" eyebrow={c.chatPage.eyebrow} title={<>{c.chatPage.title} <em>{c.chatPage.titleAccent}</em></>} description={c.chatPage.description} />
    <div className="chat-audience animate-in"><span className="chat-audience-icon"><Eye size={20} /></span><div><strong>{visitors === null ? "—" : visitors.toLocaleString(language === "id" ? "id-ID" : "en-US")}</strong><span>{c.chatPage.visitorCount}</span></div><small>{c.chatPage.sinceTracking}</small></div>
    <div className="chat-shell animate-in"><div className="chat-topbar"><span className="chat-room-icon"><MessageCircle size={19} /></span><div><strong>{c.chatPage.room}</strong><span>{c.chatPage.everyone}</span></div><span className="chat-live"><span /> {c.chatPage.live}</span></div>
      {initializing ? <div className="chat-join"><span className="loading-dot" /> {c.chatPage.connecting}</div> : !username ? <div className="chat-join">
        <div className="join-symbol"><MessageCircle size={30} strokeWidth={1.5} /></div><h2>{c.chatPage.joinTitle}</h2><p>{c.chatPage.joinDescription}</p>
        <form onSubmit={join}><label htmlFor="chat-name">{c.chatPage.usernameLabel}</label><div className="join-input"><UserRound size={18} /><input id="chat-name" type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder={c.chatPage.usernamePlaceholder} maxLength={24} minLength={3} pattern="[A-Za-z0-9_]{3,24}" required autoComplete="nickname" /></div><button className="button-primary" disabled={busy} type="submit">{c.chatPage.join} <ArrowRight size={17} /></button></form>
        <p className="chat-hint"><ShieldCheck size={14} /> {c.chatPage.hint}</p>
      </div> : <>
        <div className="chat-messages" ref={messagesRef} aria-live="polite">{messages.length === 0 && <div className="chat-empty"><Sparkles size={23} /><strong>{c.chatPage.emptyTitle}</strong><span>{c.chatPage.emptyDescription}</span></div>}{messages.map((message) => <div className="chat-message" key={message.id}><span className="message-avatar">{message.username.slice(0, 1).toUpperCase()}</span><div><div className="message-header"><strong>{message.username}</strong><time>{new Date(message.created_at.replace(" ", "T") + "Z").toLocaleTimeString(language === "id" ? "id-ID" : "en-US", { hour: "2-digit", minute: "2-digit" })}</time></div><p>{message.body}</p></div></div>)}<div ref={bottomRef} /></div>
        <form className="chat-compose" onSubmit={send}><span className="compose-me" title={`${c.chatPage.postingAs} ${username}`}>{username.slice(0, 1).toUpperCase()}</span><input aria-label={c.chatPage.message} value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder={`${c.chatPage.messageAs} ${username}...`} required /><button disabled={busy || !text.trim()} type="submit" aria-label={c.chatPage.send}><Send size={18} /></button></form>
      </>}
    </div><div className="chat-status" role="status">{status ? c.chatPage[status] : username ? `${c.chatPage.postingAs} ${username} · ${c.chatPage.kindness}` : ""}</div>
  </div>;
}

export default function Portfolio() {
  const [active, setActive] = useState<Tab>("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [language, setLanguage] = useState<Language>("id");
  const c = copy[language];
  const panelRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const menuInitialized = useRef(false);
  const visitTracked = useRef(false);
  const github = useGithub(active === "github");

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = language === "id" ? "Muhammad Faizal — Portofolio" : "Muhammad Faizal — Portfolio";
  }, [language]);

  useEffect(() => {
    if (visitTracked.current) return;
    visitTracked.current = true;
    void fetch("/api/visitors", { method: "POST", credentials: "same-origin", keepalive: true }).catch(() => {});
  }, []);

  useLayoutEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar || !menuInitialized.current) { menuInitialized.current = true; return; }
    if (window.innerWidth > 780 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tween = gsap.fromTo(sidebar, { xPercent: mobileOpen ? -103 : 0 }, { xPercent: mobileOpen ? 0 : -103, duration: 0.3, ease: "power3.out" });
    return () => { tween.kill(); };
  }, [mobileOpen]);

  useEffect(() => {
    const clearOnDesktop = () => { if (window.innerWidth > 780 && sidebarRef.current) gsap.set(sidebarRef.current, { clearProps: "transform" }); };
    window.addEventListener("resize", clearOnDesktop);
    return () => window.removeEventListener("resize", clearOnDesktop);
  }, []);

  useEffect(() => {
    const update = () => {
      const hash = window.location.hash.slice(1);
      setActive(tabs.includes(hash as Tab) ? hash as Tab : "home");
    };
    update(); window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  useEffect(() => {
    if (!shellRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.fromTo(".sidebar", { x: -26, opacity: 0 }, { x: 0, opacity: 1, duration: 0.75, ease: "power3.out" });
      gsap.fromTo(".content-frame", { x: 26, opacity: 0 }, { x: 0, opacity: 1, duration: 0.75, delay: 0.1, ease: "power3.out" });
    }, shellRef);
    return () => context.revert();
  }, []);

  useEffect(() => {
    if (!panelRef.current) return;
    panelRef.current.scrollTop = 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.fromTo(".animate-in", { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.07, duration: 0.58, ease: "power3.out", clearProps: "transform,opacity" });
    }, panelRef);
    return () => context.revert();
  }, [active, github.data, github.error, github.loading]);

  const navigate = (tab: Tab) => { setMobileOpen(false); if (active !== tab) window.location.hash = tab; };

  return <LanguageContext.Provider value={language}><div className="site-wrap"><CustomCursor /><div className="site-glow glow-left" /><div className="site-glow glow-right" /><div className="app-shell" ref={shellRef}>
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`} ref={sidebarRef}>
      <div className="sidebar-top"><button className="brand" onClick={() => navigate("home")} aria-label={`Muhammad Faizal — ${c.common.home}`}>mf<span>.</span></button><button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label={c.common.closeMenu}><X size={20} /></button></div>
      <div className="sidebar-profile"><div className="sidebar-avatar" role="img" aria-label={c.common.photoPlaceholder}><span>MF</span><i /></div><div className="profile-name">Muhammad Faizal <BadgeCheck className="verified-badge" size={19} fill="#1d9bf0" stroke="#ffffff" strokeWidth={1.8} aria-label={c.common.verified} /></div><div className="profile-badge"><span /> {c.common.profileStatus}</div></div>
      <div className="sidebar-controls"><div className="language-switch" aria-label={c.common.languageControl}><button className={language === "en" ? "selected" : ""} onClick={() => setLanguage("en")} aria-pressed={language === "en"}>EN</button><button className={language === "id" ? "selected" : ""} onClick={() => setLanguage("id")} aria-pressed={language === "id"}>ID</button></div><a className="sidebar-icon-link" href="https://github.com/MhmmdFaizal04" target="_blank" rel="noopener noreferrer" aria-label={`${c.common.openGithub} Muhammad Faizal`}><Github size={19} /></a><button className="sidebar-icon-link" onClick={() => navigate("chat")} aria-label={c.common.openChat}><MessageCircle size={19} /></button></div>
      <div className="sidebar-divider" />
      <nav className="navigation" aria-label={language === "id" ? "Navigasi utama" : "Main navigation"}>{navigation.map(({ id, icon: Icon }) => <button key={id} className={`nav-item ${active === id ? "nav-active" : ""}`} onClick={() => navigate(id)} onPointerEnter={(event) => { if (event.pointerType === "mouse") animateSidebarIcon(event.currentTarget, true); }} onPointerLeave={(event) => { if (event.pointerType === "mouse") animateSidebarIcon(event.currentTarget, false); }} onFocus={(event) => animateSidebarIcon(event.currentTarget, true)} onBlur={(event) => animateSidebarIcon(event.currentTarget, false)} aria-current={active === id ? "page" : undefined}><Icon className="nav-icon" size={18} strokeWidth={1.8} /><span>{c.common[id]}</span>{active === id && <ArrowRight className="nav-current-arrow" size={16} />}</button>)}</nav>
    </aside>
    <main className="content-frame"><div className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label={c.common.openMenu}><Menu size={21} /></button><div className="breadcrumb"><span>{c.common.portfolio}</span><ChevronRight size={13} /><strong>{c.common[active].toUpperCase()}</strong></div><div className="topbar-right"><span className="topbar-location"><MapPin size={14} /> {c.common.location}</span><span className="topbar-divider" /><a href="https://github.com/MhmmdFaizal04" target="_blank" rel="noopener noreferrer" aria-label={c.common.openGithub}><Github size={19} /></a><button className="topbar-chat" aria-label={c.common.openChat} onClick={() => navigate("chat")}><MessageCircle size={19} /></button></div></div>
      <section className="content-panel" ref={panelRef} aria-label={`${c.common[active]} ${language === "id" ? "konten" : "content"}`}>
        {active === "home" && <HomePanel navigate={navigate} />}
        {active === "skills" && <SkillsPanel />}
        {active === "experiences" && <ExperiencesPanel />}
        {active === "achievements" && <Achievements />}
        {active === "projects" && <ProjectsPanel />}
        {active === "github" && <GithubPanel github={github} />}
        {active === "chat" && <ChatPanel />}
        {active === "contact" && <Contact openChat={() => navigate("chat")} />}
      </section>
    </main>
  </div></div></LanguageContext.Provider>;
}
