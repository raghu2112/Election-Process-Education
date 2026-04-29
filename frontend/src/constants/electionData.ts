/**
 * constants/electionData.ts — Static election data
 * ==================================================
 * Defined at module level — zero re-allocation on re-renders.
 * All arrays are frozen (readonly) to prevent accidental mutation.
 *
 * Covers:
 *  - ELECTION_PHASES (timeline)
 *  - WIZARD_STEPS    (onboarding guide)
 *  - SUGGESTED_QUESTIONS (chat chips)
 *  - SYSTEM_PROMPT   (AI behaviour constraints)
 */

// ── Types ────────────────────────────────────────────────────

export interface ElectionPhase {
  readonly id:          string;
  readonly icon:        string;
  readonly title:       string;
  readonly color:       string;
  readonly duration:    string;
  readonly description: string;
  readonly keyActions:  readonly string[];
}

export interface WizardStep {
  readonly id:      string;
  readonly icon:    string;
  readonly title:   string;
  readonly content: string;
  readonly question:string;
  readonly options: readonly string[];
}

// ── Election Phases ──────────────────────────────────────────

export const ELECTION_PHASES: readonly ElectionPhase[] = Object.freeze([
  {
    id: "announcement", icon: "📢", color: "#3B82F6",
    title: "Announcement & Scheduling",
    duration: "6–12 months before",
    description: "Official gazette notification issued. Electoral calendar published. Model Code of Conduct activates. All administrative machinery put on standby.",
    keyActions: ["Gazette notification issued", "Electoral calendar published", "Code of Conduct activated", "Voter roll revision opens"],
  },
  {
    id: "nomination", icon: "📝", color: "#8B5CF6",
    title: "Candidate Nomination",
    duration: "3–6 months before",
    description: "Eligible citizens and parties file nomination papers with the returning officer. Papers are scrutinised; invalid nominations rejected.",
    keyActions: ["Nomination papers filed", "Security deposit paid", "Scrutiny by returning officer", "Withdrawal deadline passes"],
  },
  {
    id: "campaign", icon: "🎤", color: "#F59E0B",
    title: "Campaign Period",
    duration: "4–8 weeks before",
    description: "Candidates campaign through rallies, media, and door-to-door canvassing. Campaign finance disclosure rules apply throughout.",
    keyActions: ["Public rallies & meetings", "Media advertisements", "Door-to-door outreach", "Finance disclosure filings"],
  },
  {
    id: "registration", icon: "📋", color: "#10B981",
    title: "Voter Registration Deadline",
    duration: "4–6 weeks before",
    description: "The cutoff date for new voter enrollments. Citizens must be on the electoral roll to vote. Final rolls published and made public.",
    keyActions: ["Online / in-person signup", "Rolls finalised & published", "Voter ID cards dispatched", "Accessibility accommodations set up"],
  },
  {
    id: "voting", icon: "🗳️", color: "#EF4444",
    title: "Election Day",
    duration: "Polling day",
    description: "Polling stations open 7 am – 6 pm. Voters present valid ID, mark their choice on ballot or EVM, and receive an ink mark on their finger.",
    keyActions: ["Polling stations open 7 am", "ID verification at booth", "Ballot / EVM casting", "Indelible ink applied"],
  },
  {
    id: "counting", icon: "🔢", color: "#6366F1",
    title: "Vote Counting",
    duration: "1–3 days after voting",
    description: "Sealed EVMs / ballot boxes transported under security to counting centres. Counting conducted under CCTV with party agents present.",
    keyActions: ["Chain-of-custody enforced", "Party agent observers present", "Round-by-round tallying", "Provisional results announced"],
  },
  {
    id: "results", icon: "🏆", color: "#059669",
    title: "Results & Certification",
    duration: "Within 7 days",
    description: "Winning candidates receive formal certification from the returning officer. Commission publishes final statistics. 30-day petition window opens.",
    keyActions: ["Winner officially declared", "Result certificates issued", "Statistical report published", "Petition window opens (30 days)"],
  },
]);

// ── Wizard Steps ─────────────────────────────────────────────

export const WIZARD_STEPS: readonly WizardStep[] = Object.freeze([
  {
    id: "welcome", icon: "🗳️",
    title: "Welcome — Your Election Journey Starts Here",
    content: "This guided tour walks you through every stage of the democratic process — from how candidates are nominated to how your vote is counted and certified.\n\nWhether you're a first-time voter, a researcher, or just curious, this guide is for you.",
    question: "What best describes you?",
    options: ["First-time voter", "I've voted before", "I'm a candidate / agent", "Researcher / student"],
  },
  {
    id: "register", icon: "📋",
    title: "Step 1 — Getting Registered",
    content: "You must appear on the official electoral roll to vote. Registration is free and usually open year-round, closing 4–6 weeks before election day.\n\n🇮🇳 India: voters.eci.gov.in\n🇺🇸 USA: vote.gov\n🇬🇧 UK: gov.uk/register-to-vote\n\nAllow 2–4 weeks for processing. Check your status regularly.",
    question: "Are you currently registered to vote?",
    options: ["Yes, I'm registered", "Not yet", "Not sure — need to check", "Not eligible yet"],
  },
  {
    id: "id", icon: "🪪",
    title: "Step 2 — Your Voter ID",
    content: "Most polling stations require a valid photo ID. Accepted forms vary:\n\n• Voter ID card (most countries)\n• Passport\n• Aadhaar card (India)\n• Driver's licence\n\nApply at least 6 weeks before election day to allow postal delivery time.",
    question: "Do you have an accepted photo ID ready?",
    options: ["Yes, I have it", "Applied — awaiting delivery", "Need to apply", "Unsure what's accepted"],
  },
  {
    id: "polling", icon: "📍",
    title: "Step 3 — Your Polling Station",
    content: "Your polling station is determined by your registered address and printed on your voter ID slip or electoral roll entry. Arrive early — queues peak between 9–11 am. Some countries offer early voting or postal ballots.",
    question: "Do you know where your polling station is?",
    options: ["Yes, I know it", "Need to look it up", "I want a postal vote", "I have mobility needs"],
  },
  {
    id: "voting", icon: "✅",
    title: "Step 4 — Casting Your Vote",
    content: "On voting day:\n\n1. Bring your voter ID and notification letter\n2. Queue at your designated booth\n3. Give your name — officer locates you on the roll\n4. Enter the voting booth (private)\n5. Mark your choice clearly\n6. Submit your ballot or confirm on EVM\n7. Receive an ink mark on your finger\n\nThe whole process takes 5–10 minutes.",
    question: "Any concern about the voting process?",
    options: ["None — I'm ready!", "Language barrier", "Disability / accessibility", "Work / time conflict"],
  },
  {
    id: "complete", icon: "🎉",
    title: "You're Election-Ready!",
    content: "Congratulations! You now understand the full election cycle — from announcement to certification.\n\nYour vote is:\n🔒 Secret — no one can see how you voted\n🛡️ Protected — strict laws prevent tampering\n💪 Powerful — every vote shapes the outcome",
    question: "What would you like to do next?",
    options: ["Ask the AI guide", "Explore the timeline", "Take the quiz", "Find polling station"],
  },
]);

// ── Suggested Chat Questions ─────────────────────────────────

export const SUGGESTED_QUESTIONS: readonly string[] = Object.freeze([
  "How do I register to vote?",
  "What happens on election day?",
  "How are votes counted?",
  "What is the Electoral College?",
  "Can I vote by mail?",
  "What is gerrymandering?",
]);

// ── AI System Prompt ─────────────────────────────────────────

/**
 * Constrains the AI to the election domain and enforces neutrality.
 * Applied as the `system` parameter on every Anthropic API call.
 *
 * @security Prevents prompt injection from redirecting AI behaviour.
 */
export const SYSTEM_PROMPT = `You are ElectGuide, an expert, strictly non-partisan AI assistant
specialising in explaining election processes, voting systems, electoral law,
and democratic institutions worldwide.

RULES:
1. Answer only election/democracy-related questions.
2. Never endorse any party, candidate, or political ideology.
3. Keep responses under 280 words unless detail is explicitly requested.
4. For procedural steps, use numbered lists.
5. Use plain, accessible language suitable for first-time voters.
6. If asked something outside your domain, politely redirect to elections.

TONE: Educational, encouraging, neutral, clear.` as const;
