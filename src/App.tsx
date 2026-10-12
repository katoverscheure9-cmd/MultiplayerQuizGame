import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

type Screen =
  | "home"
  | "host-lobby"
  | "host-game"
  | "join"
  | "questions"
  | "avatar"
  | "player-lobby"
  | "player-game";

type PlayerLanguage = "nl" | "en" | "fr";
type PlayerProfile = "disadvantaged" | "normal" | "advantaged";
type StartQuestion = {
  question: string;
  options: {
    text: string;
    points: 1 | 2 | 3;
  }[];
};

type IconName =
  | "arrow"
  | "check"
  | "coin"
  | "copy"
  | "glasses"
  | "headphones"
  | "lock"
  | "phone"
  | "play"
  | "spark"
  | "trophy"
  | "users"
  | "x";

const startQuestions: StartQuestion[] = [
  {
    question: "BEN JE BLIJ MET JE ZAKGELD?",
    options: [
      { text: "Ja, ik kom wel toe", points: 2 },
      { text: "Neen, ik heb geen zakgeld", points: 1 },
      { text: "Neen, hoe meer hoe beter", points: 3 },
    ],
  },
  {
    question: "HEB JE EEN EIGEN NETFLIX ACCOUNT",
    options: [
      { text: "Nee, helaas niet", points: 1 },
      { text: "Ja", points: 3 },
      { text: "Neen, maar ik kijk op iemand anders account", points: 2 },
    ],
  },
  {
    question: "HEB JE THUIS CHIPS LIGGEN?",
    options: [
      { text: "Ja, iedereen heeft wel een snack kast thuis", points: 3 },
      { text: "Niet echt, wij eten thuis gewoon maaltijden", points: 1 },
      { text: "Soms, voor leuke gelegenheden", points: 2 },
    ],
  },
  {
    question: "HEB JE EEN EXTRA PAAR OORTJES?",
    options: [
      { text: "Ja, voor als mijn andere kapot gaan", points: 2 },
      { text: "Ja, ik heb wat extra's ergens in een lade liggen", points: 3 },
      { text: "Neen, ik heb voorlopig enkel mijn huidige paar", points: 1 },
    ],
  },
  {
    question: "WAT DOE JE ALS DE BUS STAAKT EN JE SCHOOL 10 KM VER IS?",
    options: [
      { text: "Ik geraak er waarschijnlijk niet en moet thuisblijven.", points: 1 },
      { text: "Ik vraag of ik de elektrische fiets van mijn papa mag nemen.", points: 2 },
      { text: "Ik vraag of mijn ouders me willen brengen", points: 3 },
    ],
  },
];

const questionContent: Record<PlayerLanguage, {
  questions: StartQuestion[];
  position: string;
}> = {
  nl: {
    questions: startQuestions,
    position: "Jouw startpositie",
  },
  en: {
    questions: startQuestions,
    position: "Your starting position",
  },
  fr: {
    questions: startQuestions,
    position: "Votre position de départ",
  },
};

const players = [
  { name: "Aya", color: "bg-[#FF6B35]", initials: "AY" },
  { name: "Milan", color: "bg-[#5B5FEF]", initials: "MI" },
  { name: "Noah", color: "bg-[#11A579]", initials: "NO" },
  { name: "Lina", color: "bg-[#E2498A]", initials: "LI" },
  { name: "Youssef", color: "bg-[#F3B61F]", initials: "YO" },
];
const playerCoins = [10, 20, 20, 30, 10];
const avatarOptions = [
  { color: "bg-[#FF6B35]", accent: "bg-[#F3B61F]" },
  { color: "bg-[#5B5FEF]", accent: "bg-[#FF7A59]" },
  { color: "bg-[#11A579]", accent: "bg-[#F3B61F]" },
  { color: "bg-[#E2498A]", accent: "bg-[#5B5FEF]" },
  { color: "bg-[#F3B61F]", accent: "bg-[#FF5C35]" },
  { color: "bg-[#171717]", accent: "bg-[#11A579]" },
];
const gadgetOptions: { name: string; icon: IconName }[] = [
  { name: "Bril", icon: "glasses" },
  { name: "Koptelefoon", icon: "headphones" },
  { name: "Geluksster", icon: "spark" },
];

const runnerConfigs: Record<PlayerProfile, {
  obstacles: number[];
  zones: {
    position: number;
    effect: "wait" | "restart";
    value: number;
  }[];
  speed: number;
  setback: number;
  jumpDuration: number;
}> = {
  disadvantaged: {
    obstacles: [20, 42, 82, 104, 132, 154, 182, 194],
    zones: [
      { position: 62, effect: "wait", value: 4 },
      { position: 116, effect: "restart", value: 0 },
      { position: 170, effect: "wait", value: 3 },
    ],
    speed: 0.55,
    setback: 8,
    jumpDuration: 1500,
  },
  normal: {
    obstacles: [34, 76, 124, 178],
    zones: [
      { position: 98, effect: "wait", value: 2 },
      { position: 150, effect: "restart", value: 0 },
    ],
    speed: 0.8,
    setback: 4,
    jumpDuration: 1650,
  },
  advantaged: {
    obstacles: [58, 154],
    zones: [{ position: 110, effect: "wait", value: 1 }],
    speed: 1.05,
    setback: 2,
    jumpDuration: 1800,
  },
};

const lettersByProfile: Record<PlayerProfile, string[]> = {
  disadvantaged: ["X", "S", "Q", "U", "J", "V", "Z"],
  normal: ["A", "E", "I", "N", "R", "S", "T", "L", "O", "K"],
  advantaged: ["A", "A", "E", "E", "I", "O", "N", "R", "S", "T", "L", "K", "M", "D"],
};

const bonusLetters = [
  { letter: "A", cost: 3 },
  { letter: "E", cost: 4 },
  { letter: "I", cost: 5 },
];

const letterValues: Record<string, number> = {
  A: 1, B: 3, D: 2, E: 1, G: 3, I: 1, J: 4, K: 3, L: 1, M: 3,
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 2, V: 4, X: 8, Y: 8, Z: 4,
};

const standardQuiz = [
  { question: "Wat is je lievelingseten?", answers: ["Pasta of pizza", "Rijstgerechten", "Frietjes", "Iets anders"] },
  { question: "Wie is je favoriete artiest of muzikant?", answers: ["Een soloartiest", "Een band", "Een dj of producer", "Dat wisselt vaak"] },
  { question: "Welke traditie of gewoonte van thuis vind je belangrijk?", answers: ["Samen eten", "Feestdagen vieren", "Taal en muziek", "Gastvrijheid"] },
  { question: "Waar voel je je het meest thuis?", answers: ["Thuis bij familie", "Bij mijn vrienden", "In mijn vertrouwde buurt", "Waar ik me veilig voel"] },
  { question: "Waardoor voelt een plek voor jou echt als thuis?", answers: ["De mensen om me heen", "Vertrouwde taal en geluiden", "Eten en geuren", "Een eigen rustige plek"] },
];

const finnishQuiz = [
  { question: "Mikä on lempiruokasi?", answers: ["Pasta tai pizza", "Riisiruoat", "Ranskalaiset", "Jokin muu"] },
  { question: "Kuka on suosikkiartistisi tai -muusikkosi?", answers: ["Sooloartisti", "Yhtye", "DJ tai tuottaja", "Se vaihtelee usein"] },
  { question: "Minkä kodin perinteen tai tavan koet tärkeäksi?", answers: ["Yhdessä syöminen", "Juhlapäivät", "Kieli ja musiikki", "Vieraanvaraisuus"] },
  { question: "Missä tunnet olosi eniten kotoisaksi?", answers: ["Kotona perheen kanssa", "Ystävien luona", "Tutussa ympäristössä", "Siellä missä olen turvassa"] },
  { question: "Mikä saa paikan tuntumaan sinulle kodilta?", answers: ["Ihmiset ympärilläni", "Tutut äänet ja kieli", "Ruoka ja tuoksut", "Oma rauhallinen tila"] },
];

function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    coin: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5c0-1.1 1.1-2 2.5-2s2.5.9 2.5 2-1 1.8-2.5 2c-1.5.2-2.5.9-2.5 2s1.1 2 2.5 2 2.5-.9 2.5-2M12 5.5v13" /></>,
    copy: <><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
    glasses: <><circle cx="7" cy="13" r="3" /><circle cx="17" cy="13" r="3" /><path d="M10 13h4M2 10l2 1M22 10l-2 1" /></>,
    headphones: <><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="13" width="4" height="7" rx="2" /><rect x="17" y="13" width="4" height="7" rx="2" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
    phone: <><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M10 18h4" /></>,
    play: <path d="m9 7 8 5-8 5V7Z" />,
    spark: <><path d="m12 2 1.5 5.1L18 10l-4.5 2.9L12 18l-1.5-5.1L6 10l4.5-2.9L12 2Z" /><path d="m19 16 .7 2.3L22 19.5l-2.3 1.2L19 23l-.7-2.3-2.3-1.2 2.3-1.2L19 16Z" /></>,
    trophy: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    x: <><path d="m7 7 10 10M17 7 7 17" /></>,
  };
  return <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "dark" | "ghost";
  className?: string;
  disabled?: boolean;
}) {
  const styles = {
    primary: "bg-[#FF5C35] text-white shadow-[0_4px_0_#C93B1B] hover:bg-[#F04D27]",
    secondary: "bg-white text-[#171717] border-2 border-[#171717] shadow-[0_4px_0_#171717] hover:bg-[#FFF5E8]",
    dark: "bg-[#171717] text-white shadow-[0_4px_0_#666] hover:bg-black",
    ghost: "bg-transparent text-[#171717] hover:bg-black/5",
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold transition-all active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <button type="button" onClick={() => window.location.reload()} className={`group flex items-center gap-2 text-xl font-black tracking-tight ${light ? "text-white" : "text-[#171717]"}`}>
      <span className="grid size-9 rotate-3 place-items-center rounded-lg bg-[#FF5C35] text-white transition-transform group-hover:-rotate-3">G</span>
      GELIJK<span className="text-[#FF5C35]">?</span>
    </button>
  );
}

function Header({ dark = false, onJoin }: { dark?: boolean; onJoin?: () => void }) {
  return (
    <header className={`relative z-10 flex items-center justify-between px-5 py-5 md:px-10 lg:px-16 ${dark ? "text-white" : ""}`}>
      <Logo light={dark} />
      {onJoin && <Button variant={dark ? "secondary" : "ghost"} onClick={onJoin} className="min-h-10 px-4 py-2">Meedoen</Button>}
    </header>
  );
}

function CoinBalance({ amount, dark = false }: { amount: number; dark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 font-mono text-sm font-black shadow-sm ${dark ? "bg-white/10 text-white" : "bg-[#FFF3C4] text-[#7A5500]"}`}>
      <Icon name="coin" className="size-5 text-[#F3B61F]" />
      {amount}
    </span>
  );
}

function PlayerCoinBalances() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {players.map((player, index) => (
        <span key={player.name} className="inline-flex items-center gap-2 rounded-full bg-white/10 py-1.5 pl-1.5 pr-3 text-sm font-black">
          <span className={`grid size-7 place-items-center rounded-full text-[9px] text-white ${player.color}`}>{player.initials}</span>
          <Icon name="coin" className="size-4 text-[#F3B61F]" />
          {playerCoins[index]}
        </span>
      ))}
    </div>
  );
}

function AvatarBadge({
  avatarIndex,
  gadgets = [],
  large = false,
}: {
  avatarIndex: number;
  gadgets?: number[];
  large?: boolean;
}) {
  const avatar = avatarOptions[avatarIndex];
  const shapes = [
    "rounded-[45%_45%_30%_30%]",
    "rounded-[30%_50%_35%_45%]",
    "rounded-[50%_50%_25%_25%]",
    "rounded-[35%_35%_50%_50%]",
    "rounded-2xl",
    "rounded-[55%_55%_20%_20%]",
  ];
  return (
    <span className={`relative inline-block shrink-0 ${large ? "h-32 w-36" : "h-16 w-[4.5rem]"}`}>
      {avatarIndex === 2 && (
        <>
          <span className="absolute left-[32%] top-0 h-1/4 w-1 -rotate-12 rounded-full bg-[#171717]" />
          <span className="absolute right-[32%] top-0 h-1/4 w-1 rotate-12 rounded-full bg-[#171717]" />
          <span className={`absolute left-[27%] top-0 rounded-full border-2 border-[#171717] ${avatar.accent} ${large ? "size-4" : "size-2.5"}`} />
          <span className={`absolute right-[27%] top-0 rounded-full border-2 border-[#171717] ${avatar.accent} ${large ? "size-4" : "size-2.5"}`} />
        </>
      )}
      {(avatarIndex === 0 || avatarIndex === 3) && (
        <>
          <span className={`absolute left-[18%] top-[8%] rotate-45 border-2 border-[#171717] ${avatar.accent} ${large ? "size-7" : "size-4"}`} />
          <span className={`absolute right-[18%] top-[8%] rotate-45 border-2 border-[#171717] ${avatar.accent} ${large ? "size-7" : "size-4"}`} />
        </>
      )}
      {avatarIndex === 1 && (
        <>
          <span className={`absolute left-0 top-[28%] rounded-full border-3 border-[#171717] ${avatar.accent} ${large ? "h-12 w-10" : "h-7 w-6"}`} />
          <span className={`absolute right-0 top-[28%] rounded-full border-3 border-[#171717] ${avatar.accent} ${large ? "h-12 w-10" : "h-7 w-6"}`} />
        </>
      )}
      <span className={`absolute left-[5%] top-[52%] -rotate-12 rounded-full border-2 border-[#171717] ${avatar.color} ${large ? "h-5 w-9" : "h-3 w-5"}`} />
      <span className={`absolute right-[5%] top-[52%] rotate-12 rounded-full border-2 border-[#171717] ${avatar.color} ${large ? "h-5 w-9" : "h-3 w-5"}`} />
      <span className={`absolute inset-x-[14%] bottom-[12%] top-[16%] border-4 border-[#171717] shadow-[5px_6px_0_rgba(0,0,0,.28)] ${avatar.color} ${shapes[avatarIndex]}`}>
        <span className={`absolute left-[18%] top-[27%] rounded-full bg-white shadow-[inset_0_-2px_0_rgba(0,0,0,.15)] ${large ? "h-7 w-6" : "h-4 w-3.5"}`}>
          <span className="absolute bottom-[22%] right-[20%] size-1/3 rounded-full bg-[#171717]" />
        </span>
        <span className={`absolute right-[18%] top-[27%] rounded-full bg-white shadow-[inset_0_-2px_0_rgba(0,0,0,.15)] ${large ? "h-7 w-6" : "h-4 w-3.5"}`}>
          <span className="absolute bottom-[22%] left-[20%] size-1/3 rounded-full bg-[#171717]" />
        </span>
        <span className={`absolute bottom-[22%] left-1/2 -translate-x-1/2 rounded-full border-2 border-[#171717] ${avatar.accent} ${large ? "h-4 w-11" : "h-2.5 w-7"}`}>
          {avatarIndex === 5 && <span className="absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 rounded-b-full bg-[#FF7A59]" />}
        </span>
      </span>
      <span className={`absolute bottom-0 left-[25%] rounded-b-lg border-2 border-[#171717] ${avatar.accent} ${large ? "h-6 w-8" : "h-3.5 w-5"}`} />
      <span className={`absolute bottom-0 right-[25%] rounded-b-lg border-2 border-[#171717] ${avatar.accent} ${large ? "h-6 w-8" : "h-3.5 w-5"}`} />
      {gadgets.map((gadgetIndex, index) => (
        <span key={gadgetIndex} className={`absolute z-10 grid place-items-center rounded-xl border-2 border-[#171717] bg-[#FFF9EF] text-[#171717] shadow ${large ? "size-9" : "size-5"} ${index % 2 === 0 ? "-right-1 top-0" : "-left-1 bottom-0"}`}>
          <Icon name={gadgetOptions[gadgetIndex].icon} className={large ? "size-5" : "size-3"} />
        </span>
      ))}
    </span>
  );
}

function AvatarSetup({
  profile,
  startingCoins,
  playerName,
  onComplete,
}: {
  profile: PlayerProfile;
  startingCoins: number;
  playerName: string;
  onComplete: (avatarIndex: number, gadgets: number[], remainingCoins: number) => void;
}) {
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [selectedGadgets, setSelectedGadgets] = useState<number[]>([]);
  const avatarCost = (index: number) => profile === "disadvantaged"
    ? (index < 3 ? 0 : 4)
    : profile === "normal" ? (index < 5 ? 0 : 2) : 0;
  const gadgetCost = (index: number) => profile === "disadvantaged"
    ? [2, 3, 4][index]
    : profile === "normal" ? [0, 2, 2][index] : 0;
  const totalCost = avatarCost(selectedAvatar) + selectedGadgets.reduce((total, index) => total + gadgetCost(index), 0);
  const remainingCoins = startingCoins - totalCost;

  return (
    <main className="min-h-screen bg-[#FFF9EF] text-[#171717]">
      <Header />
      <section className="mx-auto grid max-w-5xl gap-8 px-5 pb-12 pt-4 md:grid-cols-[18rem_1fr] md:items-start">
        <div className="rounded-[2rem] bg-[#5B5FEF] p-7 text-center text-white shadow-[0_9px_0_#171717]">
          <p className="text-sm font-black uppercase tracking-[.2em] text-white/60">Jouw look</p>
          <div className="mt-7"><AvatarBadge avatarIndex={selectedAvatar} gadgets={selectedGadgets} large /></div>
          <h1 className="mt-5 text-3xl font-black">{playerName}</h1>
          <div className="mt-5"><CoinBalance amount={Math.max(0, remainingCoins)} dark /></div>
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-[.2em] text-[#FF5C35]">Maak je speler</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Kies een avatar</h1>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {avatarOptions.map((_, index) => {
              const cost = avatarCost(index);
              const selected = selectedAvatar === index;
              return (
                <button type="button" key={index} aria-label={`Kies avatar ${index + 1}`} onClick={() => setSelectedAvatar(index)} className={`rounded-2xl border-2 p-4 text-center transition active:translate-y-1 ${selected ? "border-[#171717] bg-white shadow-[4px_5px_0_#171717]" : "border-[#D8D1C7] bg-[#F7F4EE] hover:border-[#5B5FEF]"}`}>
                  <AvatarBadge avatarIndex={index} />
                  <span className={`mt-2 inline-flex min-h-6 items-center gap-1 rounded-full px-2 text-xs font-black ${cost ? "bg-[#FFF3C4] text-[#7A5500]" : "bg-[#E8F8F2] text-[#087B5B]"}`}>
                    {cost ? <><Icon name="coin" className="size-3" />{cost}</> : "Gratis"}
                  </span>
                </button>
              );
            })}
          </div>
          <h2 className="mt-9 text-2xl font-black">Voeg gadgets toe</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {gadgetOptions.map((gadget, index) => {
              const cost = gadgetCost(index);
              const selected = selectedGadgets.includes(index);
              return (
                <button type="button" key={gadget.name} onClick={() => setSelectedGadgets((current) => selected ? current.filter((item) => item !== index) : [...current, index])} className={`flex items-center rounded-2xl border-2 p-4 text-left font-black transition ${selected ? "border-[#171717] bg-[#FFF0D8] shadow-[3px_4px_0_#171717]" : "border-[#D8D1C7] bg-white"}`}>
                  <span className="mr-3 grid size-11 place-items-center rounded-xl bg-[#171717] text-white"><Icon name={gadget.icon} /></span>
                  <span>{gadget.name}<span className="mt-1 flex items-center gap-1 text-xs text-[#716A61]">{cost ? <><Icon name="coin" className="size-3" />{cost}</> : "Gratis"}</span></span>
                </button>
              );
            })}
          </div>
          <Button className="mt-8 w-full" disabled={remainingCoins < 0} onClick={() => onComplete(selectedAvatar, selectedGadgets, remainingCoins)}>
            Klaar om te spelen <Icon name="arrow" />
          </Button>
        </div>
      </section>
    </main>
  );
}

function LevelIntro({
  level,
  title,
  description,
  onStart,
}: {
  level: 2 | 3;
  title: string;
  description: string;
  onStart: () => void;
}) {
  const isThirdLevel = level === 3;
  return (
    <main className={`flex min-h-screen flex-col text-white ${isThirdLevel ? "bg-[#171433]" : "bg-[#5B5FEF]"}`}>
      <Header dark />
      <section className="m-auto w-full max-w-2xl px-6 pb-20 text-center">
        <div className={`mx-auto grid size-28 rotate-3 place-items-center rounded-[2rem] border-4 border-[#171717] text-6xl font-black shadow-[9px_10px_0_#171717] ${isThirdLevel ? "bg-[#F3B61F] text-[#171717]" : "bg-[#FF5C35]"}`}>
          {level}
        </div>
        <p className="mt-10 text-sm font-black uppercase tracking-[.3em] text-white/60">Level {level}</p>
        <h1 className="mt-3 text-5xl font-black tracking-tight sm:text-6xl">{title}</h1>
        <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-white/70">{description}</p>
        <Button variant="secondary" className="mt-9 min-w-64 text-lg" onClick={onStart}>
          Start level {level} <Icon name="arrow" />
        </Button>
      </section>
    </main>
  );
}

const finalPlayerPositions = [12, 34, 51, 72, 88];
const finalGameScores = [58, 46, 70, 39, 62];

function RankingBar({
  positions = finalPlayerPositions,
  currentPosition,
  currentAvatarIndex = 0,
  currentGadgets = [],
  showAvatars = true,
  compact = false,
}: {
  positions?: number[];
  currentPosition?: number;
  currentAvatarIndex?: number;
  currentGadgets?: number[];
  showAvatars?: boolean;
  compact?: boolean;
}) {
  const entries = players.map((player, index) => ({ ...player, position: positions[index], avatarIndex: index % avatarOptions.length, gadgets: [] as number[] }));
  if (currentPosition !== undefined) {
    entries.push({ name: "Jij", initials: "JIJ", color: "bg-white text-[#171717]", position: currentPosition, avatarIndex: currentAvatarIndex, gadgets: currentGadgets });
  }

  return (
    <div
      aria-label="Spelerspositie"
      className={`relative mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,.2)] ${compact ? "h-64" : "h-96"}`}
    >
      <div className="absolute inset-x-8 top-0 h-20 rounded-full bg-[#F3B61F]/25 blur-3xl" />
      <div className="absolute inset-x-8 bottom-0 h-20 rounded-full bg-[#5B5FEF]/20 blur-3xl" />
      <div className="absolute bottom-4 left-1/2 top-4 w-3 -translate-x-1/2 overflow-hidden rounded-full border border-white/30 bg-black/20 shadow-[0_0_24px_rgba(255,255,255,.15)]">
        <div className="h-full w-full bg-gradient-to-b from-[#F3B61F] via-[#FF5C35] to-[#5B5FEF]" />
        <div className="absolute inset-y-0 left-1 w-px bg-white/50" />
      </div>
      {entries.map((entry, index) => {
        const isCurrent = entry.name === "Jij";
        const offset = index % 2 === 0 ? -54 : 18;
        return (
          <span
            key={entry.name}
            className={`absolute z-10 -translate-y-1/2 transition-all duration-700 ease-out ${isCurrent ? "rounded-2xl ring-4 ring-[#F3B61F]/40" : ""}`}
            style={{
              left: `calc(50% + ${showAvatars ? (isCurrent ? -36 : offset - 18) : (isCurrent ? -24 : offset)}px)`,
              top: `${Math.max(9, Math.min(91, entry.position))}%`,
            }}
          >
            {showAvatars ? (
              <AvatarBadge avatarIndex={entry.avatarIndex} gadgets={entry.gadgets} />
            ) : (
              <span className={`grid place-items-center rounded-full border-2 font-black shadow-[0_4px_10px_rgba(0,0,0,.28)] ${entry.color} ${isCurrent ? "size-12 border-[#F3B61F] text-xs text-[#171717]" : "size-9 border-white/80 text-[10px] text-white"}`}>{entry.initials}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

function ScoreBar({
  scores,
  currentScore,
  currentAvatarIndex = 0,
  currentGadgets = [],
  compact = false,
}: {
  scores: number[];
  currentScore?: number;
  currentAvatarIndex?: number;
  currentGadgets?: number[];
  compact?: boolean;
}) {
  const entries = players.map((player, index) => ({ ...player, score: scores[index] ?? 0, avatarIndex: index % avatarOptions.length, gadgets: [] as number[] }));
  if (currentScore !== undefined) {
    entries.push({ name: "Jij", initials: "JIJ", color: "bg-white text-[#171717]", score: currentScore, avatarIndex: currentAvatarIndex, gadgets: currentGadgets });
  }
  const highestScore = Math.max(1, ...entries.map((entry) => entry.score));

  return (
    <div
      aria-label="Spelscore"
      className={`relative mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/15 bg-[#063F35]/35 shadow-[inset_0_1px_0_rgba(255,255,255,.2)] ${compact ? "h-64" : "h-96"}`}
    >
      <span className="absolute left-3 top-3 grid size-8 place-items-center rounded-xl bg-white/15 text-[#F3B61F]">
        <Icon name="trophy" className="size-4" />
      </span>
      <div className="absolute inset-x-8 top-0 h-20 rounded-full bg-[#11A579]/35 blur-3xl" />
      <div className="absolute bottom-4 left-1/2 top-4 w-3 -translate-x-1/2 overflow-hidden rounded-full border border-white/30 bg-black/20 shadow-[0_0_24px_rgba(255,255,255,.15)]">
        <div className="h-full w-full bg-gradient-to-b from-[#F3B61F] via-[#11A579] to-[#087B5B]" />
        <div className="absolute inset-y-0 left-1 w-px bg-white/50" />
      </div>
      {entries.map((entry, index) => {
        const isCurrent = entry.name === "Jij";
        const offset = index % 2 === 0 ? -54 : 18;
        const scorePosition = 10 + (1 - entry.score / highestScore) * 80;
        return (
          <span
            key={entry.name}
            className={`absolute z-10 -translate-y-1/2 transition-all duration-700 ease-out ${isCurrent ? "rounded-2xl ring-4 ring-[#F3B61F]/40" : ""}`}
            style={{
              left: `calc(50% + ${isCurrent ? -36 : offset - 18}px)`,
              top: `${scorePosition}%`,
            }}
          >
            <AvatarBadge avatarIndex={entry.avatarIndex} gadgets={entry.gadgets} />
            <span className="absolute right-0 top-0 min-w-6 rounded-full bg-[#171717] px-1.5 py-1 text-center text-[9px] font-black leading-none text-white">{entry.score}</span>
          </span>
        );
      })}
    </div>
  );
}

const StableRankingBar = memo(RankingBar);
const StableScoreBar = memo(ScoreBar);

function RaceBar({
  positions,
  elapsed = 0,
  currentProgress,
  currentAvatarIndex = 0,
  currentGadgets = [],
}: {
  positions?: number[];
  elapsed?: number;
  currentProgress?: number;
  currentAvatarIndex?: number;
  currentGadgets?: number[];
}) {
  const simulatedPositions = positions ?? [
    Math.min(100, 2 + elapsed * 1.8),
    Math.min(100, elapsed * 2.2),
    Math.min(100, elapsed * 2.65),
    Math.min(100, 1 + elapsed * 2),
    Math.min(100, elapsed * 1.6),
  ];
  const entries = players.map((player, index) => ({ ...player, progress: simulatedPositions[index] ?? 0, avatarIndex: index % avatarOptions.length, gadgets: [] as number[] }));
  if (currentProgress !== undefined) {
    entries.push({ name: "Jij", initials: "JIJ", color: "bg-white text-[#171717]", progress: currentProgress, avatarIndex: currentAvatarIndex, gadgets: currentGadgets });
  }

  return (
    <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.2)] md:p-7">
      <div className="flex items-center justify-between">
        <span className="text-sm font-black uppercase tracking-[.2em] text-white/60">Race naar de finish</span>
        <span className="grid size-10 place-items-center rounded-xl bg-[#11A579] text-white"><Icon name="spark" /></span>
      </div>
      <div className="mt-5 space-y-3">
        {entries.map((entry) => {
          const isCurrent = entry.name === "Jij";
          return (
            <div key={entry.name} className="grid grid-cols-[3.5rem_1fr] items-center gap-3">
              <span className={`truncate text-xs font-black ${isCurrent ? "text-[#F3B61F]" : "text-white/70"}`}>{entry.name}</span>
              <div className="relative h-16 overflow-hidden rounded-2xl border border-white/15 bg-black/25">
                <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#5B5FEF]/60 via-[#FF5C35]/70 to-[#F3B61F]/80 transition-all duration-500" style={{ width: `${entry.progress}%` }} />
                <span className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 scale-75 transition-[left] duration-500 ${isCurrent ? "rounded-2xl ring-4 ring-[#F3B61F]/50" : ""}`} style={{ left: `${Math.max(7, Math.min(93, entry.progress))}%` }}>
                  <AvatarBadge avatarIndex={entry.avatarIndex} gadgets={entry.gadgets} />
                </span>
                <span className="absolute inset-y-0 right-3 w-1 bg-white/80" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JourneyLevel({
  profile,
  position,
  gameScore,
  coins,
  avatarIndex,
  gadgets,
  onComplete,
}: {
  profile: PlayerProfile;
  position: number;
  gameScore: number;
  coins: number;
  avatarIndex: number;
  gadgets: number[];
  onComplete: () => void;
}) {
  const config = runnerConfigs[profile];
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [zoneWait, setZoneWait] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [extraSteps, setExtraSteps] = useState(0);
  const [resets, setResets] = useState(0);
  const [coinsRemaining, setCoinsRemaining] = useState(coins);
  const [isJumping, setIsJumping] = useState(false);
  const [jumpReady, setJumpReady] = useState(true);
  const [shield, setShield] = useState(0);
  const [passedObstacles, setPassedObstacles] = useState<number[]>([]);
  const [passedZones, setPassedZones] = useState<number[]>([]);
  const [incident, setIncident] = useState<{ effect: "wait" | "restart"; value: number } | null>(null);
  const [incidentRevealed, setIncidentRevealed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const jumpStartedAt = useRef(0);
  const jumpTimer = useRef<number | null>(null);
  const jumpCooldownTimer = useRef<number | null>(null);
  const competitorScores = finalGameScores;
  const profileLabel = profile === "disadvantaged" ? "A" : profile === "normal" ? "B" : "C";

  const land = useCallback(() => {
    if (jumpTimer.current !== null) window.clearTimeout(jumpTimer.current);
    jumpTimer.current = null;
    setIsJumping(false);
    if (jumpCooldownTimer.current !== null) window.clearTimeout(jumpCooldownTimer.current);
    jumpCooldownTimer.current = window.setTimeout(() => setJumpReady(true), 500);
  }, []);

  const jump = useCallback(() => {
    if (countdown > 0 || zoneWait > 0 || incident || !jumpReady || isJumping || completed) return;
    setJumpReady(false);
    setIsJumping(true);
    jumpStartedAt.current = Date.now();
    jumpTimer.current = window.setTimeout(land, config.jumpDuration);
  }, [completed, config.jumpDuration, countdown, incident, isJumping, jumpReady, land, zoneWait]);

  const releaseJump = useCallback(() => {
    if (!isJumping) return;
    const minimumJumpDuration = 700;
    const timeInAir = Date.now() - jumpStartedAt.current;
    if (jumpTimer.current !== null) window.clearTimeout(jumpTimer.current);
    jumpTimer.current = window.setTimeout(land, Math.max(0, minimumJumpDuration - timeInAir));
  }, [isJumping, land]);

  const revealIncident = () => {
    if (!incident) return;
    setIncidentRevealed(true);
    if (incident.effect === "wait") {
      setZoneWait(incident.value);
      return;
    }
    setResets((current) => current + 1);
    setExtraSteps((current) => current + Math.round(progress));
    setPassedObstacles([]);
    setProgress(0);
  };

  useEffect(() => {
    if (countdown === 0 || completed) return;
    const timer = window.setTimeout(() => setCountdown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [completed, countdown]);

  useEffect(() => {
    if (countdown > 0 || completed) return;
    const timer = window.setInterval(() => setElapsed((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [completed, countdown]);

  useEffect(() => {
    if (zoneWait === 0) return;
    const timer = window.setTimeout(() => setZoneWait((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [zoneWait]);

  useEffect(() => {
    if (countdown > 0 || zoneWait > 0 || incident || completed) return;
    const timer = window.setTimeout(() => {
      const nextProgress = Math.min(200, progress + config.speed);
      const zoneIndex = config.zones.findIndex((zone, index) => (
        !passedZones.includes(index) && zone.position > progress && zone.position <= nextProgress + 0.25
      ));
      if (zoneIndex >= 0) {
        const zone = config.zones[zoneIndex];
        setPassedZones((current) => [...current, zoneIndex]);
        setProgress(nextProgress);
        setIncident(zone);
        return;
      }
      const obstacleIndex = config.obstacles.findIndex((obstacle, index) => (
        !passedObstacles.includes(index) && obstacle > progress && obstacle <= nextProgress + 0.25
      ));
      if (obstacleIndex >= 0) {
        setPassedObstacles((current) => [...current, obstacleIndex]);
        if (isJumping) {
          setProgress(nextProgress);
          return;
        }
        if (shield > 0) {
          setShield((current) => current - 1);
          setProgress(nextProgress);
          return;
        }
        setIncident({ effect: "restart", value: 0 });
        return;
      }
      setProgress(nextProgress);
      if (nextProgress >= 200) setCompleted(true);
    }, 100);
    return () => window.clearTimeout(timer);
  }, [completed, config, countdown, incident, isJumping, passedObstacles, passedZones, progress, shield, zoneWait]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" && event.code !== "ArrowUp") return;
      event.preventDefault();
      if (event.repeat) return;
      jump();
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space" && event.code !== "ArrowUp") return;
      releaseJump();
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [jump, releaseJump]);

  useEffect(() => () => {
    if (jumpTimer.current !== null) window.clearTimeout(jumpTimer.current);
    if (jumpCooldownTimer.current !== null) window.clearTimeout(jumpCooldownTimer.current);
  }, []);

  const comparisonRows = [
    { name: "Aya", profile: "A", time: 94, steps: 112, resets: 3 },
    { name: "Milan", profile: "B", time: 63, steps: 48, resets: 2 },
    { name: "Noah", profile: "C", time: 37, steps: 2, resets: 0 },
    { name: "Lina", profile: "B", time: 58, steps: 36, resets: 1 },
    { name: "Jij", profile: profileLabel, time: elapsed, steps: extraSteps, resets },
  ];

  return (
    <main className="min-h-screen bg-[#171433] text-white">
      <Header dark />
      <section className="mx-auto max-w-6xl px-5 pb-12">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-black">Level 3 · Same destination, different journey</span>
          <div className="flex items-center gap-3">
            <AvatarBadge avatarIndex={avatarIndex} gadgets={gadgets} />
            <CoinBalance amount={coinsRemaining} dark />
            <span className="font-mono font-black">{elapsed}s</span>
          </div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-[#FF5C35] to-[#F3B61F] transition-all" style={{ width: `${progress / 2}%` }} />
        </div>
        {!completed && <div className="mt-7"><RaceBar elapsed={elapsed} currentProgress={progress / 2} currentAvatarIndex={avatarIndex} currentGadgets={gadgets} /></div>}
        {!completed ? (
          <>
            <div className="relative mt-8 h-80 overflow-hidden rounded-[2rem] border-4 border-[#5B5FEF] bg-gradient-to-b from-[#373B86] via-[#24275F] to-[#11132F] shadow-[0_10px_0_#090719]">
              <div className="absolute left-[12%] top-10 h-3 w-20 rounded-full bg-white/15" />
              <div className="absolute left-[62%] top-16 h-3 w-28 rounded-full bg-white/10" />
              <div className="absolute inset-x-0 bottom-0 h-16 border-t-4 border-[#F3B61F] bg-[#181A35]">
                <div className="mt-5 h-1 w-full bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.35)_0_18px,transparent_18px_34px)]" />
              </div>
              {config.zones.map((zone, index) => {
                const relativePosition = 14 + (zone.position - progress) * 0.86;
                if (relativePosition < -5 || relativePosition > 105 || passedZones.includes(index)) return null;
                return (
                  <div
                    key={zone.position}
                    className="absolute bottom-16 top-0 w-24 -translate-x-1/2 border-x-2 border-[#FF5C35]/80 bg-[repeating-linear-gradient(135deg,rgba(255,92,53,.42)_0_10px,rgba(201,59,27,.2)_10px_20px)] shadow-[0_0_28px_rgba(255,92,53,.35)] transition-[left] duration-100 ease-linear"
                    style={{ left: `${relativePosition}%` }}
                  />
                );
              })}
              {config.obstacles.map((obstacle, index) => {
                const relativePosition = 14 + (obstacle - progress) * 0.86;
                if (relativePosition < 5 || relativePosition > 105 || passedObstacles.includes(index)) return null;
                return (
                  <div key={obstacle} className="absolute bottom-16 w-6 -translate-x-1/2 transition-[left] duration-100 ease-linear" style={{ left: `${relativePosition}%` }}>
                    <div className={`mx-auto rounded-t-lg border-2 border-[#171717] shadow-[3px_0_0_#171717] ${index % 3 === 0 ? "h-16 bg-[#FF5C35]" : index % 3 === 1 ? "h-12 bg-[#F3B61F]" : "h-20 bg-[#5B5FEF]"}`} />
                  </div>
                );
              })}
              <div className="absolute bottom-16 h-[150px] w-2 bg-white transition-[left] duration-100 ease-linear" style={{ left: `${14 + (200 - progress) * 0.86}%` }}>
                <span className="absolute -left-10 top-0 w-20 bg-[#11A579] px-2 py-2 text-center text-xs font-black">FINISH</span>
              </div>
              <div className={`absolute left-[12%] z-10 transition-all duration-200 ${isJumping ? "bottom-40" : "bottom-16"}`}>
                <AvatarBadge avatarIndex={avatarIndex} gadgets={gadgets} />
              </div>
              {shield > 0 && <div className="absolute bottom-12 left-[9.5%] size-20 rounded-full border-4 border-[#11A579] bg-[#11A579]/10 shadow-[0_0_24px_#11A579]" />}
              {countdown > 0 && (
                <div className="absolute inset-0 z-20 grid place-items-center bg-[#171433]/75 backdrop-blur-sm">
                  <div className="rounded-3xl bg-white p-6 text-center text-[#171717] shadow-[0_8px_0_#090719]">
                    <p className="text-sm font-black uppercase tracking-[.18em] text-[#FF5C35]">Maak je klaar</p>
                    <p className="mt-2 font-mono text-7xl font-black">{countdown}</p>
                  </div>
                </div>
              )}
            </div>
            {incident && (
              <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 px-5 backdrop-blur-[2px]">
                <div className="w-full max-w-lg overflow-hidden rounded-xl border-4 border-[#0875E1] bg-[#ECE9D8] font-mono text-[#171717] shadow-[10px_12px_0_rgba(0,0,0,.4)]">
                  <div className="flex items-center justify-between bg-gradient-to-b from-[#1684F5] to-[#0054C8] px-4 py-2 text-white">
                    <span className="text-3xl font-black tracking-tight">Uh oh</span>
                    <span className="grid size-10 place-items-center rounded-md border-2 border-white/30 bg-[#A8A8A8] text-white/70"><Icon name="x" className="size-7" /></span>
                  </div>
                  <div className="p-7 sm:p-10">
                    <div className="flex items-center gap-6">
                      <span className="grid size-16 shrink-0 rotate-6 place-items-center border-4 border-[#171717] bg-[#C7C3B4] text-4xl font-black shadow-[4px_4px_0_#777]">!</span>
                      <p className="text-xl font-bold sm:text-2xl">
                        {!incidentRevealed
                          ? "You're screwed."
                          : incident.effect === "restart"
                            ? "Je moet opnieuw van start beginnen."
                            : zoneWait > 0
                              ? `Je moet nog ${zoneWait} seconden wachten.`
                              : "Je mag weer verder."}
                      </p>
                    </div>
                    {!incidentRevealed ? (
                      <button type="button" onClick={revealIncident} className="mx-auto mt-9 block min-w-44 border-4 border-[#171717] bg-[#ECE9D8] px-8 py-3 text-xl font-black shadow-[inset_3px_3px_0_white,inset_-3px_-3px_0_#999] active:translate-y-0.5">
                        Damn
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={incident.effect === "wait" && zoneWait > 0}
                        onClick={() => { setIncident(null); setIncidentRevealed(false); }}
                        className="mx-auto mt-9 block min-w-44 border-4 border-[#171717] bg-[#ECE9D8] px-8 py-3 text-xl font-black shadow-[inset_3px_3px_0_white,inset_-3px_-3px_0_#999] active:translate-y-0.5 disabled:cursor-wait disabled:opacity-50"
                      >
                        Verder
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Button className="w-full text-lg" onClick={jump} disabled={countdown > 0 || zoneWait > 0 || incident !== null || !jumpReady}>
                <Icon name="arrow" className="size-6 -rotate-90" /> Hold spacebar to jump
              </Button>
              <Button variant="secondary" className="w-full" disabled={zoneWait > 0 || incident !== null || coinsRemaining < 3 || shield > 0} onClick={() => { setCoinsRemaining((current) => current - 3); setShield((current) => current + 1); }}>
                <Icon name="coin" /> Bescherming voor 3
              </Button>
            </div>
          </>
        ) : (
          <div className="mt-8">
            {!revealed ? (
              <div className="rounded-[2rem] bg-[#FFF9EF] p-8 text-center text-[#171717] shadow-[0_10px_0_#090719]">
                <div className="mx-auto grid size-20 place-items-center rounded-full bg-[#11A579] text-white"><Icon name="check" className="size-10" /></div>
                <h1 className="mt-6 text-4xl font-black">Je hebt dezelfde finish bereikt</h1>
                <p className="mx-auto mt-3 max-w-xl text-lg text-[#716A61]">Nu vergelijken we hoe verschillend de reis voor iedere speler was.</p>
                <Button className="mt-7" onClick={() => setRevealed(true)}>Vergelijk de routes <Icon name="arrow" /></Button>
              </div>
            ) : (
              <div className="rounded-[2rem] bg-[#FFF9EF] p-5 text-[#171717] shadow-[0_10px_0_#090719] md:p-8">
                <p className="text-sm font-black uppercase tracking-[.2em] text-[#FF5C35]">De verborgen profielen</p>
                <h1 className="mt-3 text-4xl font-black">Zelfde bestemming. Andere kansen.</h1>
                <div className="mt-7 overflow-x-auto">
                  <div className="min-w-[620px]">
                    <div className="grid grid-cols-[1.2fr_repeat(4,1fr)] gap-2 px-3 text-xs font-black uppercase tracking-wider text-[#716A61]">
                      <span>Speler</span><span>Profiel</span><span>Tijd</span><span>Extra afstand</span><span>Herstarts</span>
                    </div>
                    {comparisonRows.map((row) => (
                      <div key={row.name} className={`mt-2 grid grid-cols-[1.2fr_repeat(4,1fr)] items-center gap-2 rounded-xl px-3 py-3 font-bold ${row.name === "Jij" ? "bg-[#FFF0D8] ring-2 ring-[#FF5C35]" : "bg-[#F4F0E8]"}`}>
                        <span>{row.name}</span><span className="font-black">{row.profile}</span><span>{row.time}s</span><span>+{row.steps}</span><span>{row.resets}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-7 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-[#FFE8E1] p-4"><p className="font-black">Profiel A</p><p className="mt-1 text-sm text-[#716A61]">Minder middelen, meer controles en langere omwegen.</p></div>
                  <div className="rounded-2xl bg-[#EFEFFF] p-4"><p className="font-black">Profiel B</p><p className="mt-1 text-sm text-[#716A61]">Een mix van kortere routes en onverwachte herstarts.</p></div>
                  <div className="rounded-2xl bg-[#E8F8F2] p-4"><p className="font-black">Profiel C</p><p className="mt-1 text-sm text-[#716A61]">Meer middelen, snellere toegang en minder barrières.</p></div>
                </div>
                <div className="mt-6 rounded-2xl bg-[#171717] p-5 text-white">
                  <p className="font-black">Bespreek samen</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">Waar zag je privileges, bureaucratie, taalbarrières of ongelijke kansen? Wat zou het parcours eerlijker maken?</p>
                </div>
                <Button className="mt-6 w-full" onClick={onComplete}>Gesprek afronden <Icon name="arrow" /></Button>
              </div>
            )}
          </div>
        )}
        {!completed && (
          <div className="mt-8 grid grid-cols-2 gap-5">
            <StableRankingBar currentPosition={position} currentAvatarIndex={avatarIndex} currentGadgets={gadgets} compact />
            <StableScoreBar scores={competitorScores} currentScore={gameScore} currentAvatarIndex={avatarIndex} currentGadgets={gadgets} compact />
          </div>
        )}
      </section>
    </main>
  );
}

function Home({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <main className="flex min-h-screen flex-col bg-[#5B5FEF] text-white">
      <Header dark />
      <section className="m-auto flex w-full max-w-md flex-col items-center px-5 pb-24 text-center">
        <div className="grid size-20 place-items-center rounded-3xl bg-[#FF5C35] text-4xl font-black shadow-[7px_8px_0_#171717]">G</div>
        <h1 className="mt-8 text-5xl font-black tracking-tight">Klaar om te spelen?</h1>
        <Button onClick={() => setScreen("host-lobby")} variant="secondary" className="mt-10 w-full text-xl">
          <Icon name="play" /> Start game
        </Button>
        <button type="button" onClick={() => setScreen("join")} className="mt-6 font-bold text-white/80 underline decoration-white/30 underline-offset-4 transition hover:text-white">
          Ik heb een gamecode
        </button>
      </section>
    </main>
  );
}

function HostLobby({ setScreen }: { setScreen: (screen: Screen) => void }) {
  const [copied, setCopied] = useState(false);
  const [questionsStarted, setQuestionsStarted] = useState(false);
  const [playerPositions, setPlayerPositions] = useState([50, 50, 50, 50, 50]);

  useEffect(() => {
    if (!questionsStarted) return;
    const timer = window.setInterval(() => {
      setPlayerPositions((current) => {
        if (current.every((position, index) => Math.abs(finalPlayerPositions[index] - position) < 0.2)) {
          window.clearInterval(timer);
          return finalPlayerPositions;
        }
        return current.map((position, index) => {
          const target = finalPlayerPositions[index];
          return position + (target - position) * 0.35;
        });
      });
    }, 800);
    return () => window.clearInterval(timer);
  }, [questionsStarted]);

  return (
    <main className="min-h-screen bg-[#5B5FEF] text-white">
      <Header dark />
      <section className="mx-auto flex max-w-6xl flex-col items-center px-5 pb-12 pt-5 text-center">
        <p className="text-sm font-black uppercase tracking-[.25em] text-white/70">Spelcode</p>
        <button type="button" onClick={() => { navigator.clipboard?.writeText("472 918"); setCopied(true); }} className="mt-2 flex items-center gap-4 rounded-2xl px-6 py-2 text-6xl font-black tracking-[.12em] transition hover:bg-white/10 md:text-8xl">
          472 918 <Icon name={copied ? "check" : "copy"} className="size-8" />
        </button>
        <p className="mt-3 text-lg text-white/80">Ga naar <strong className="text-white">gelijk.game</strong> en vul de code in</p>
        <div className="mt-10 w-full rounded-[2rem] bg-white p-6 text-[#171717] shadow-[0_10px_0_rgba(0,0,0,.22)] md:p-9">
          <div className="flex flex-col items-start justify-between gap-4 border-b border-black/10 pb-6 sm:flex-row sm:items-center">
            <div className="text-left">
              <p className="text-2xl font-black">{questionsStarted ? "De 5 startvragen" : "Alle deelnemers zijn binnen"}</p>
              <p className="mt-1 text-[#716A61]">{questionsStarted ? "Iedere speler beantwoordt de vragen privé op de eigen telefoon." : "Start de vragen zodra iedereen op het scherm staat."}</p>
            </div>
            <span className="rounded-full bg-[#E8F8F2] px-4 py-2 font-black text-[#087B5B]"><Icon name="users" className="mr-2 inline size-5" />5 spelers</span>
          </div>
          <div className="grid grid-cols-2 gap-4 py-8 sm:grid-cols-3 md:grid-cols-5">
            {players.map((player, i) => (
              <div key={player.name} className="animate-[pop_.35s_ease-out_both] rounded-2xl bg-[#F7F4EE] p-4" style={{ animationDelay: `${i * 80}ms` }}>
                <span className={`mx-auto grid size-16 place-items-center rounded-full text-lg font-black text-white ${player.color}`}>{player.initials}</span>
                <p className="mt-3 font-black">{player.name}</p>
                <p className="mt-1 text-xs font-semibold text-[#11A579]"><Icon name="check" className="mr-1 inline size-3" />{questionsStarted ? "5/5 beantwoord" : "Aangesloten"}</p>
              </div>
            ))}
          </div>
          {questionsStarted && <RankingBar positions={playerPositions} showAvatars={false} />}
          <Button onClick={() => questionsStarted ? setScreen("host-game") : setQuestionsStarted(true)} disabled={players.length < 2} className="w-full text-lg sm:w-auto"><Icon name="play" /> {questionsStarted ? "Start de woordrondes" : "Start de 5 vragen"}</Button>
        </div>
      </section>
    </main>
  );
}

function Join({ onJoin }: { onJoin: (name: string) => void }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  return (
    <main className="min-h-screen bg-[#FFF9EF]">
      <Header />
      <section className="mx-auto flex max-w-md flex-col px-5 pb-12 pt-8">
        <div className="mb-7 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#5B5FEF] text-white shadow-[5px_6px_0_#171717]"><Icon name="phone" className="size-8" /></span>
          <h1 className="mt-6 text-4xl font-black tracking-tight">Doe mee</h1>
          <p className="mt-2 text-[#716A61]">Vul de code in die je op het grote scherm ziet.</p>
        </div>
        <div className="rounded-3xl border-2 border-[#171717] bg-white p-6 shadow-[7px_8px_0_#171717]">
          <label className="block text-sm font-black" htmlFor="code">Spelcode</label>
          <input id="code" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="472 918" className="mt-2 w-full rounded-xl border-2 border-[#D8D1C7] bg-[#FFFDF8] px-4 py-4 text-center font-mono text-2xl font-black tracking-[.2em] outline-none transition focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/15" />
          <label className="mt-5 block text-sm font-black" htmlFor="name">Jouw voornaam</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Bijv. Sam" className="mt-2 w-full rounded-xl border-2 border-[#D8D1C7] bg-[#FFFDF8] px-4 py-4 text-lg font-bold outline-none transition focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/15" />
          <Button onClick={() => onJoin(name.trim())} disabled={code.length < 6 || !name.trim()} className="mt-6 w-full">Voeg mij toe <Icon name="arrow" /></Button>
        </div>
        <p className="mt-6 text-center text-xs leading-relaxed text-[#8A837A]">Je antwoorden zijn privé en worden niet gedeeld met andere spelers of de presentator.</p>
      </section>
    </main>
  );
}

function Questions({ language, onComplete }: { language: PlayerLanguage; onComplete: (profile: PlayerProfile, position: number) => void }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const content = questionContent[language];
  const getPosition = (scores: number[]) => {
    if (!scores.length) return 50;
    const averageScore = scores.reduce((total, score) => total + score, 0) / scores.length;
    return 9 + ((3 - averageScore) / 2) * 82;
  };
  const answer = (points: number) => {
    const next = [...answers, points];
    setAnswers(next);
    if (index === content.questions.length - 1) {
      const totalScore = next.reduce((total, score) => total + score, 0);
      if (totalScore >= 12) onComplete("disadvantaged", getPosition(next));
      else if (totalScore <= 8) onComplete("advantaged", getPosition(next));
      else onComplete("normal", getPosition(next));
    }
    else setIndex(index + 1);
  };
  return (
    <main className="flex min-h-screen flex-col bg-[#171717] text-white">
      <Header dark />
      <div className="h-2 bg-white/10"><div className="h-full bg-[#FF5C35] transition-all" style={{ width: `${((index + 1) / content.questions.length) * 100}%` }} /></div>
      <section className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-10 px-5 py-10 md:grid-cols-[minmax(0,1fr)_24rem]">
        <div>
          <div className="flex items-center justify-between">
            <p className="font-black text-[#FF7A59]">{content.position}</p>
            <p className="font-mono text-sm text-white/60">{index + 1} / {content.questions.length}</p>
          </div>
          <h1 className="mt-8 text-3xl font-black leading-tight tracking-tight sm:text-4xl">{content.questions[index].question}</h1>
          <div className="mt-8 grid gap-3">
            {content.questions[index].options.map((option) => (
              <button
                type="button"
                key={option.text}
                onClick={() => answer(option.points)}
                className="group flex min-h-20 items-center rounded-2xl border-2 border-white/20 bg-white/5 px-5 py-4 text-left text-lg font-black transition hover:-translate-y-1 hover:border-[#11A579] hover:bg-[#11A579]"
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
        <RankingBar currentPosition={getPosition(answers)} showAvatars={false} />
      </section>
    </main>
  );
}

function PlayerLobby({
  language,
  setLanguage,
  setScreen,
  playerName,
}: {
  language: PlayerLanguage;
  setLanguage: (language: PlayerLanguage) => void;
  setScreen: (screen: Screen) => void;
  playerName: string;
}) {
  return (
    <main className="flex min-h-screen flex-col bg-[#11A579] text-white">
      <Header dark />
      <section className="m-auto w-full max-w-md px-6 pb-16 text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-white text-[#11A579] shadow-[7px_8px_0_#087B5B]"><Icon name="users" className="size-10" /></div>
        <h1 className="mt-7 text-4xl font-black tracking-tight">Iedereen is binnen</h1>
        <p className="mt-3 leading-relaxed text-white/80">Dit zijn de deelnemers die met spelcode 472 918 zijn aangesloten.</p>
        <div className="mt-6 rounded-2xl bg-white p-4 text-left text-[#171717] shadow-[4px_5px_0_#087B5B]">
          <label htmlFor="language" className="block text-sm font-black">Kies jouw taal · Choose your language</label>
          <select
            id="language"
            value={language}
            onChange={(event) => setLanguage(event.target.value as PlayerLanguage)}
            className="mt-2 w-full rounded-xl border-2 border-[#D8D1C7] bg-[#FFFDF8] px-4 py-3 font-bold outline-none focus:border-[#5B5FEF]"
          >
            <option value="nl">Nederlands</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </div>
        <div className="mt-7 grid grid-cols-3 gap-3 rounded-3xl bg-white/15 p-4">
          {[...players, { name: playerName, color: "bg-[#171717]", initials: playerName.slice(0, 2).toUpperCase() }].map((player) => (
            <div key={player.name} className="rounded-xl bg-white/10 p-2">
              <span className={`mx-auto grid size-11 place-items-center rounded-full text-xs font-black text-white ${player.color}`}>{player.initials}</span>
              <p className="mt-2 text-sm font-bold">{player.name}</p>
            </div>
          ))}
        </div>
        <Button onClick={() => setScreen("questions")} variant="secondary" className="mt-7 w-full">
          {language === "nl" && "Beantwoord 5 startvragen"}
          {language === "en" && "Answer 5 starting questions"}
          {language === "fr" && "Répondez aux 5 questions"}
          <Icon name="arrow" />
        </Button>
      </section>
    </main>
  );
}

function HostGame() {
  const [round, setRound] = useState(1);
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [journeyReveal, setJourneyReveal] = useState(false);
  const [raceElapsed, setRaceElapsed] = useState(0);
  const [hostRaceCountdown, setHostRaceCountdown] = useState(3);
  const hostScores = [9, 7, 12, 5, 10].map((score) => score * round);

  useEffect(() => {
    if (level !== 3 || journeyReveal || hostRaceCountdown > 0 || raceElapsed >= 63) return;
    const timer = window.setTimeout(() => setRaceElapsed((current) => current + 1), 1000);
    return () => window.clearTimeout(timer);
  }, [hostRaceCountdown, journeyReveal, level, raceElapsed]);

  useEffect(() => {
    if (level !== 3 || hostRaceCountdown === 0) return;
    const timer = window.setTimeout(() => setHostRaceCountdown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [hostRaceCountdown, level]);

  if (level === 3) {
    return (
      <main className="min-h-screen bg-[#171433] text-white">
        <Header dark />
        <section className="mx-auto max-w-6xl px-5 pb-12 pt-5 md:px-10">
          <div className="flex items-center justify-between text-sm font-black uppercase tracking-[.18em]">
            <span>Level 3</span><span>Same destination, different journey</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#FF5C35] to-[#F3B61F]" /></div>
          <div className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-5">
            <RankingBar compact />
            <ScoreBar scores={[58, 46, 70, 39, 62]} compact />
          </div>
          <div className="mt-4"><PlayerCoinBalances /></div>
          {!journeyReveal ? (
            <div className="mt-10 rounded-[2rem] bg-[#FFF9EF] p-6 text-[#171717] shadow-[0_12px_0_rgba(0,0,0,.35)] md:p-10">
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-[.2em] text-[#716A61]">Iedereen vertrok tegelijk naar dezelfde finish</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Spring naar dezelfde finish</h1>
              </div>
              <div className="relative mt-9 rounded-[2rem] bg-[#171433] p-4">
                <RaceBar elapsed={raceElapsed} />
                {hostRaceCountdown > 0 && (
                  <div className="absolute inset-4 grid place-items-center rounded-[1.5rem] bg-[#171433]/85 backdrop-blur-sm">
                    <div className="text-center text-white">
                      <p className="text-sm font-black uppercase tracking-[.2em] text-white/60">Maak je klaar</p>
                      <p className="mt-2 font-mono text-8xl font-black">{hostRaceCountdown}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-9 text-center"><Button onClick={() => setJourneyReveal(true)}>Toon de vergelijking <Icon name="arrow" /></Button></div>
            </div>
          ) : (
            <div className="mt-10 rounded-[2rem] bg-[#FFF9EF] p-6 text-[#171717] shadow-[0_12px_0_rgba(0,0,0,.35)] md:p-10">
              <p className="text-sm font-black uppercase tracking-[.2em] text-[#FF5C35]">De verborgen profielen worden zichtbaar</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">Dezelfde finish, ongelijke kansen</h1>
              <div className="mt-7 overflow-x-auto">
                <div className="min-w-[700px]">
                  <div className="grid grid-cols-[1.2fr_repeat(4,1fr)] gap-2 px-3 text-xs font-black uppercase tracking-wider text-[#716A61]">
                    <span>Speler</span><span>Profiel</span><span>Tijd</span><span>Extra afstand</span><span>Herstarts</span>
                  </div>
                  {[
                    ["Aya", "A", "94s", "+112", "3"],
                    ["Milan", "B", "63s", "+48", "2"],
                    ["Noah", "C", "37s", "+2", "0"],
                    ["Lina", "B", "58s", "+36", "1"],
                    ["Youssef", "A", "101s", "+126", "3"],
                  ].map((row, index) => (
                    <div key={row[0]} className="mt-2 grid grid-cols-[1.2fr_repeat(4,1fr)] items-center gap-2 rounded-xl bg-[#F4F0E8] px-3 py-3 font-bold">
                      <span className="flex items-center gap-2"><span className={`grid size-7 place-items-center rounded-full text-[9px] text-white ${players[index].color}`}>{players[index].initials}</span>{row[0]}</span>
                      {row.slice(1).map((value, valueIndex) => <span key={`${value}-${valueIndex}`}>{value}</span>)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-7 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-[#171717] p-5 text-white"><p className="font-black">Wat maakte het verschil?</p><p className="mt-2 leading-relaxed text-white/70">Startmiddelen, taalbarrières, onverwachte herstarts en routes die voor sommigen vanzelf korter waren.</p></div>
                <div className="rounded-2xl bg-[#E8F8F2] p-5"><p className="font-black">Bespreek samen</p><p className="mt-2 leading-relaxed text-[#48665D]">Wat zou er moeten veranderen zodat niet alleen het doel, maar ook de kansen eerlijker worden?</p></div>
              </div>
            </div>
          )}
        </section>
      </main>
    );
  }

  if (level === 2) {
    return (
      <main className="min-h-screen bg-[#5B5FEF] text-white">
        <Header dark />
        <section className="mx-auto max-w-6xl px-5 pb-12 pt-5 text-center md:px-10">
          <div className="flex items-center justify-between text-sm font-black uppercase tracking-[.18em]">
            <span>Level 2 · Korte quiz</span><span>Vraag 1 / 5</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/20"><div className="h-full w-1/5 rounded-full bg-white" /></div>
          <div className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-5">
            <RankingBar compact />
            <ScoreBar scores={[36, 28, 48, 20, 40]} compact />
          </div>
          <div className="mt-4"><PlayerCoinBalances /></div>
          <div className="mt-10 rounded-[2rem] bg-[#FFF9EF] p-8 text-[#171717] shadow-[0_12px_0_rgba(0,0,0,.22)] md:p-14">
            <p className="font-bold uppercase tracking-[.2em] text-[#716A61]">Kies één antwoord op je telefoon</p>
            <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">De volgende vraag staat klaar</h1>
            <div className="mx-auto mt-10 max-w-xl rounded-2xl bg-[#EFEFFF] p-5 font-bold text-[#4D50D4]">
              Iedere speler ziet de quiz op het eigen scherm.
            </div>
          </div>
          <Button variant="secondary" className="mt-8" onClick={() => setLevel(3)}>Start level 3 <Icon name="arrow" /></Button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FF5C35] text-white">
      <Header dark />
      <section className="mx-auto max-w-6xl px-5 pb-12 pt-5 md:px-10">
        <div className="flex items-center justify-between text-sm font-black uppercase tracking-[.18em]">
          <span>Woordstrijd</span><span>Ronde {round} / 4</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/20"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${(round / 4) * 100}%` }} /></div>
        <div className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-5">
          <RankingBar compact />
          <ScoreBar scores={hostScores} compact />
        </div>
        <div className="mt-4"><PlayerCoinBalances /></div>
        <div className="mt-10 rounded-[2rem] bg-[#FFF9EF] p-6 text-center text-[#171717] shadow-[0_12px_0_rgba(0,0,0,.22)] md:p-12">
          <p className="font-bold uppercase tracking-[.2em] text-[#716A61]">Iedereen speelt met zijn eigen letters</p>
          <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">Maak een woord met je letters</h1>
          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
            {players.map((player, i) => (
              <div key={player.name} className="flex items-center rounded-2xl border-2 border-[#171717] bg-white p-4 text-left font-black shadow-[3px_4px_0_#171717]">
                <span className={`mr-3 grid size-10 shrink-0 place-items-center rounded-full text-xs text-white ${player.color}`}>{player.initials}</span>
                <span>{player.name}<span className={`mt-1 block text-xs ${i < round ? "text-[#11A579]" : "text-[#8A837A]"}`}>{i < round ? "Ingediend" : "Bezig..."}</span></span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between">
          <p className="hidden text-sm font-semibold text-white/80 sm:block">30 seconden per ronde</p>
          <Button variant="secondary" onClick={() => round === 4 ? setLevel(2) : setRound(round + 1)}>{round === 4 ? "Start level 2" : "Volgende ronde"} <Icon name="arrow" /></Button>
        </div>
      </section>
    </main>
  );
}

function PlayerGame({
  profile,
  position,
  initialCoins,
  avatarIndex,
  gadgets,
}: {
  profile: PlayerProfile;
  position: number;
  initialCoins: number;
  avatarIndex: number;
  gadgets: number[];
}) {
  const [selected, setSelected] = useState<number[]>([]);
  const [usedLetters, setUsedLetters] = useState<number[]>([]);
  const [unlockedBonusLetters, setUnlockedBonusLetters] = useState<number[]>([]);
  const [pendingBonusLetter, setPendingBonusLetter] = useState<number | null>(null);
  const [unlockWait, setUnlockWait] = useState(0);
  const [isUnlockWaiting, setIsUnlockWaiting] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [coinBalance, setCoinBalance] = useState(initialCoins);
  const roundTime = profile === "disadvantaged" ? 20 : profile === "advantaged" ? 45 : 30;
  const [timeLeft, setTimeLeft] = useState(roundTime);
  const [round, setRound] = useState(1);
  const [finished, setFinished] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [level2IntroDone, setLevel2IntroDone] = useState(false);
  const [level3IntroDone, setLevel3IntroDone] = useState(false);
  const [quizWarningOpen, setQuizWarningOpen] = useState(true);
  const [quizWarningReady, setQuizWarningReady] = useState(false);
  const [quizTranslated, setQuizTranslated] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [journeyFinished, setJourneyFinished] = useState(false);
  const letters = lettersByProfile[profile];
  const allLetters = useMemo(() => [...letters, ...bonusLetters.map((bonus) => bonus.letter)], [letters]);
  const competitorScores = useMemo(
    () => [9, 7, 12, 5, 10].map((score) => score * Math.min(round, 4)),
    [round],
  );
  const translationCost = 8;
  const usesFinnish = profile === "disadvantaged" && !quizTranslated;
  const quiz = useMemo(
    () => usesFinnish
      ? finnishQuiz
      : profile === "advantaged" ? standardQuiz.slice(0, 3) : standardQuiz,
    [profile, usesFinnish],
  );

  useEffect(() => {
    if (!finished || !level2IntroDone || quizFinished || !usesFinnish || !quizWarningOpen) return;
    const timer = window.setTimeout(() => setQuizWarningReady(true), 4000);
    return () => window.clearTimeout(timer);
  }, [finished, level2IntroDone, quizFinished, quizWarningOpen, usesFinnish]);

  useEffect(() => {
    if (finished || timeLeft === 0) return;
    const timer = window.setInterval(() => setTimeLeft((time) => Math.max(0, time - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [finished, timeLeft, round]);

  useEffect(() => {
    if (!isUnlockWaiting || unlockWait === 0) return;
    const timer = window.setTimeout(() => setUnlockWait((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [isUnlockWaiting, unlockWait]);

  useEffect(() => {
    if (!isUnlockWaiting || unlockWait > 0 || pendingBonusLetter === null) return;
    setUnlockedBonusLetters((current) => [...current, pendingBonusLetter]);
    setPendingBonusLetter(null);
    setIsUnlockWaiting(false);
  }, [isUnlockWaiting, pendingBonusLetter, unlockWait]);

  const nextRound = () => {
    if (round === 4) {
      setFinished(true);
      return;
    }
    setRound((current) => current + 1);
    setSelected([]);
    setTimeLeft(roundTime);
  };

  const submitWord = () => {
    const wordScore = selected.reduce((total, letterIndex) => total + letterValues[allLetters[letterIndex]], 0);
    setGameScore((score) => score + wordScore);
    setUsedLetters((used) => [...used, ...selected]);
    nextRound();
  };

  if (finished) {
    if (journeyFinished) {
      return (
        <main className="flex min-h-screen flex-col bg-[#11A579] text-white">
          <Header dark />
          <section className="m-auto w-full max-w-2xl px-6 pb-20 text-center">
            <div className="mx-auto grid size-24 place-items-center rounded-full bg-white text-[#11A579] shadow-[7px_8px_0_#087B5B]"><Icon name="check" className="size-12" /></div>
            <h1 className="mt-8 text-5xl font-black tracking-tight">{profile === "disadvantaged" ? "Peli suoritettu" : "Spel voltooid"}</h1>
            <p className="mt-4 text-lg text-white/80">{profile === "disadvantaged" ? "Olet suorittanut kaikki kolme tasoa." : "Je hebt alle drie de levels afgerond."}</p>
            <div className="mt-6"><AvatarBadge avatarIndex={avatarIndex} gadgets={gadgets} large /></div>
            <div className="mt-5"><CoinBalance amount={coinBalance} dark /></div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <StableRankingBar currentPosition={position} currentAvatarIndex={avatarIndex} currentGadgets={gadgets} compact />
              <StableScoreBar scores={competitorScores} currentScore={gameScore} currentAvatarIndex={avatarIndex} currentGadgets={gadgets} compact />
            </div>
          </section>
        </main>
      );
    }

    if (!level2IntroDone) {
      return (
        <LevelIntro
          level={2}
          title="Korte quiz"
          description="De woordrondes zijn voorbij. Maak je klaar voor vijf persoonlijke vragen op je eigen scherm."
          onStart={() => setLevel2IntroDone(true)}
        />
      );
    }

    if (quizFinished) {
      if (!level3IntroDone) {
        return (
          <LevelIntro
            level={3}
            title="Same destination, different journey"
            description="De quiz is afgerond. Hierna race je met jouw monstertje tegen de andere spelers naar dezelfde finish."
            onStart={() => setLevel3IntroDone(true)}
          />
        );
      }
      return (
        <JourneyLevel
          profile={profile}
          position={position}
          gameScore={gameScore}
          coins={coinBalance}
          avatarIndex={avatarIndex}
          gadgets={gadgets}
          onComplete={() => setJourneyFinished(true)}
        />
      );
    }

    const currentQuestion = quiz[quizIndex];
    return (
      <main className="flex min-h-screen flex-col bg-[#5B5FEF] text-white">
        <Header dark />
        {usesFinnish && quizWarningOpen && quizWarningReady && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 px-5 backdrop-blur-[2px]">
            <div className="w-full max-w-lg overflow-hidden rounded-xl border-4 border-[#0875E1] bg-[#ECE9D8] font-mono text-[#171717] shadow-[10px_12px_0_rgba(0,0,0,.4)]">
              <div className="flex items-center justify-between bg-gradient-to-b from-[#1684F5] to-[#0054C8] px-4 py-2 text-white">
                <span className="text-3xl font-black tracking-tight">Uh oh</span>
                <span className="grid size-10 place-items-center rounded-md border-2 border-white/30 bg-[#A8A8A8] text-white/70"><Icon name="x" className="size-7" /></span>
              </div>
              <div className="p-7 sm:p-10">
                <div className="flex items-center gap-6">
                  <span className="grid size-16 shrink-0 rotate-6 place-items-center border-4 border-[#171717] bg-[#C7C3B4] text-4xl font-black shadow-[4px_4px_0_#777]">!</span>
                  <p className="text-xl font-bold sm:text-2xl">You're screwed. You don't understand, do you?</p>
                </div>
                <div className="mt-9 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => setQuizWarningOpen(false)} className="border-4 border-[#171717] bg-[#ECE9D8] px-5 py-3 text-lg font-black shadow-[inset_3px_3px_0_white,inset_-3px_-3px_0_#999] active:translate-y-0.5">
                    Ga verder
                  </button>
                  <button
                    type="button"
                    disabled={coinBalance < translationCost}
                    onClick={() => {
                      setCoinBalance((current) => current - translationCost);
                      setQuizTranslated(true);
                      setQuizWarningOpen(false);
                      setQuizAnswer(null);
                    }}
                    className="border-4 border-[#171717] bg-[#ECE9D8] px-5 py-3 text-lg font-black shadow-[inset_3px_3px_0_white,inset_-3px_-3px_0_#999] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Vertaal voor {translationCost} munten
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <section className="flex flex-1 flex-col px-5 pb-8">
          <div className="mx-auto w-full max-w-2xl">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-black/15 px-3 py-1 text-sm font-black">{usesFinnish ? "Taso 2 · Lyhyt tietovisa" : "Level 2 · Korte quiz"}</span>
              <div className="flex items-center gap-3">
                <AvatarBadge avatarIndex={avatarIndex} gadgets={gadgets} />
                <CoinBalance amount={coinBalance} dark />
                <span className="font-mono font-bold">{usesFinnish ? "Kysymys" : "Vraag"} {quizIndex + 1} / {quiz.length}</span>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/15"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${((quizIndex + 1) / quiz.length) * 100}%` }} /></div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <StableRankingBar currentPosition={position} currentAvatarIndex={avatarIndex} currentGadgets={gadgets} compact />
              <StableScoreBar scores={competitorScores} currentScore={gameScore} currentAvatarIndex={avatarIndex} currentGadgets={gadgets} compact />
            </div>
            <p className="mt-8 text-sm font-black uppercase tracking-[.18em] text-white/60">{usesFinnish ? "Valitse yksi vastaus" : "Kies één antwoord"}</p>
            <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight">{currentQuestion.question}</h1>
            <div className="mt-8 grid gap-3">
              {currentQuestion.answers.map((answer, index) => (
                <button
                  type="button"
                  key={answer}
                  onClick={() => setQuizAnswer(index)}
                  className={`flex min-h-16 items-center rounded-2xl border-2 border-[#171717] p-3 text-left font-black text-[#171717] shadow-[3px_4px_0_#171717] transition active:translate-y-1 active:shadow-none ${quizAnswer === index ? "bg-[#F3B61F]" : "bg-[#FFF9EF]"}`}
                >
                  <span className="mr-4 grid size-10 shrink-0 place-items-center rounded-lg bg-[#FF5C35] text-white">{["A", "B", "C", "D"][index]}</span>
                  {answer}
                </button>
              ))}
            </div>
            <Button
              variant="secondary"
              className="mt-7 w-full"
              disabled={quizAnswer === null}
              onClick={() => {
                if (quizIndex === quiz.length - 1) setQuizFinished(true);
                else {
                  setQuizIndex((current) => current + 1);
                  setQuizAnswer(null);
                }
              }}
            >
              {quizIndex === quiz.length - 1
                ? (usesFinnish ? "Lopeta tietovisa" : "Quiz afronden")
                : (usesFinnish ? "Seuraava kysymys" : "Volgende vraag")}
              <Icon name="arrow" />
            </Button>
          </div>
        </section>
      </main>
    );
  }

  const currentWord = selected.map((index) => allLetters[index]).join("");
  return (
    <main className="flex min-h-screen flex-col bg-[#FF5C35] text-white">
      <Header dark />
      <section className="flex flex-1 flex-col px-5 pb-8">
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-black/15 px-3 py-1 text-sm font-black">Woordronde {round} / 4</span>
            <div className="flex items-center gap-3">
              <AvatarBadge avatarIndex={avatarIndex} gadgets={gadgets} />
              <CoinBalance amount={coinBalance} dark />
              <span className="font-mono text-3xl font-black">00:{String(timeLeft).padStart(2, "0")}</span>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/15"><div className="h-full rounded-full bg-white" style={{ width: `${(round / 4) * 100}%` }} /></div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <StableRankingBar currentPosition={position} currentAvatarIndex={avatarIndex} currentGadgets={gadgets} compact />
            <StableScoreBar scores={competitorScores} currentScore={gameScore} currentAvatarIndex={avatarIndex} currentGadgets={gadgets} compact />
          </div>
          <h1 className="mt-8 text-4xl font-black leading-tight tracking-tight">Maak een woord</h1>
          <p className="mt-3 text-white/80">Tik je letters aan. Ontgrendel extra letters met munten. Een ingediende letter kun je niet opnieuw gebruiken.</p>
          <div className="mt-8 flex min-h-20 items-center justify-center gap-1 rounded-2xl border-2 border-white/30 bg-black/10 px-4 text-3xl font-black tracking-widest">
            {selected.length ? currentWord : <span className="text-base font-semibold tracking-normal text-white/50">Jouw woord...</span>}
          </div>
          <div className={`mt-6 grid gap-2 ${allLetters.length > 6 ? "grid-cols-6" : "grid-cols-5"}`}>
            {allLetters.map((letter, i) => {
              const bonusIndex = i - letters.length;
              const isBonus = bonusIndex >= 0;
              const isUnlocked = !isBonus || unlockedBonusLetters.includes(bonusIndex);
              const bonus = isBonus ? bonusLetters[bonusIndex] : null;
              const used = usedLetters.includes(i) || selected.includes(i);
              return (
                <button
                  type="button"
                  key={`${letter}${i}`}
                  disabled={used || timeLeft === 0 || (!isUnlocked && isUnlockWaiting)}
                  onClick={() => {
                    if (!isUnlocked && bonus) setPendingBonusLetter(bonusIndex);
                    else setSelected([...selected, i]);
                  }}
                  className={`relative aspect-square rounded-xl border-2 border-[#171717] text-xl font-black text-[#171717] shadow-[3px_4px_0_#171717] transition active:translate-y-1 active:shadow-none disabled:opacity-20 ${isUnlocked ? "bg-[#FFF9EF]" : "bg-[#FFF3C4]"}`}
                >
                  {letter}
                  {isUnlocked ? (
                    <span className="absolute bottom-1 right-1 text-[9px] font-black leading-none">{letterValues[letter]}</span>
                  ) : (
                    <>
                      <Icon name="lock" className="absolute left-1 top-1 size-3.5" />
                      <span className="absolute bottom-1 right-1 inline-flex items-center gap-0.5 text-[9px] font-black leading-none"><Icon name="coin" className="size-2.5" />{bonus?.cost}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
          {pendingBonusLetter !== null && (
            <div className="mt-4 rounded-2xl border-2 border-white/25 bg-black/15 p-4">
              <p className="font-black">Ontgrendel de letter {bonusLetters[pendingBonusLetter].letter}</p>
              {isUnlockWaiting ? (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-white/10 px-4 py-3">
                  <span className="font-bold text-white/70">Even wachten…</span>
                  <span className="font-mono text-3xl font-black">{unlockWait}</span>
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Button
                    variant="secondary"
                    disabled={coinBalance < bonusLetters[pendingBonusLetter].cost}
                    onClick={() => {
                      const bonus = bonusLetters[pendingBonusLetter];
                      setCoinBalance((current) => current - bonus.cost);
                      setUnlockedBonusLetters((current) => [...current, pendingBonusLetter]);
                      setPendingBonusLetter(null);
                    }}
                  >
                    <Icon name="coin" /> Betaal {bonusLetters[pendingBonusLetter].cost}
                  </Button>
                  <Button onClick={() => { setUnlockWait(5); setIsUnlockWaiting(true); }}>Wacht 5 seconden</Button>
                </div>
              )}
            </div>
          )}
          {selected.length > 0 && <button type="button" onClick={() => setSelected((current) => current.slice(0, -1))} className="mt-3 w-full text-sm font-bold text-white/80 underline underline-offset-4">Laatste letter verwijderen</button>}
          <Button variant="secondary" className="mt-6 w-full" disabled={!selected.length || timeLeft === 0} onClick={submitWord}>Dien woord in <Icon name="arrow" /></Button>
          <Button variant="ghost" className="mt-3 w-full text-white hover:bg-white/10" onClick={() => nextRound()}>Ik kan niet meer leggen — pas</Button>
          {timeLeft === 0 && <p className="mt-3 text-center text-sm font-bold">De tijd is voorbij. Ga door naar de volgende ronde.</p>}
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>("normal");
  const [playerPosition, setPlayerPosition] = useState(50);
  const [playerCoinBalance, setPlayerCoinBalance] = useState(20);
  const [playerAvatar, setPlayerAvatar] = useState(0);
  const [playerGadgets, setPlayerGadgets] = useState<number[]>([]);
  const [playerName, setPlayerName] = useState("Speler");
  const [playerLanguage, setPlayerLanguage] = useState<PlayerLanguage>("nl");
  if (screen === "host-lobby") return <HostLobby setScreen={setScreen} />;
  if (screen === "host-game") return <HostGame />;
  if (screen === "join") return <Join onJoin={(name) => { setPlayerName(name); setScreen("player-lobby"); }} />;
  if (screen === "questions") return <Questions language={playerLanguage} onComplete={(profile, position) => {
    setPlayerProfile(profile);
    setPlayerPosition(position);
    setPlayerCoinBalance(profile === "disadvantaged" ? 10 : profile === "normal" ? 20 : 30);
    setScreen("avatar");
  }} />;
  if (screen === "avatar") return (
    <AvatarSetup
      profile={playerProfile}
      startingCoins={playerCoinBalance}
      playerName={playerName}
      onComplete={(avatarIndex, gadgets, remainingCoins) => {
        setPlayerAvatar(avatarIndex);
        setPlayerGadgets(gadgets);
        setPlayerCoinBalance(remainingCoins);
        setScreen("player-game");
      }}
    />
  );
  if (screen === "player-lobby") return <PlayerLobby language={playerLanguage} setLanguage={setPlayerLanguage} setScreen={setScreen} playerName={playerName} />;
  if (screen === "player-game") return <PlayerGame profile={playerProfile} position={playerPosition} initialCoins={playerCoinBalance} avatarIndex={playerAvatar} gadgets={playerGadgets} />;
  return <Home setScreen={setScreen} />;
}
