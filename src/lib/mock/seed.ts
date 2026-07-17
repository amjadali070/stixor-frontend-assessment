import { addDays, setHours, startOfDay, subDays } from "date-fns";

import {
  PRIORITIES,
  STATUSES,
  type Assignee,
  type Customer,
  type Task,
} from "@/types/task";

/**
 * Deterministic PRNG (mulberry32) with a fixed seed so the dataset is
 * identical on every load — required for stable dev/demo behavior.
 */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260401);

/** Random integer in [min, max], inclusive, from the seeded PRNG. */
function int(min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

function pick<T>(arr: readonly T[]): T {
  return arr[int(0, arr.length - 1)];
}

export const CUSTOMERS: Customer[] = [
  { id: "cust-01", name: "Olivia Bennett", company: "Acme Corporation" },
  { id: "cust-02", name: "Marcus Webb", company: "Globex Industries" },
  { id: "cust-03", name: "Priya Sharma", company: "Initech Solutions" },
  { id: "cust-04", name: "Daniel Okafor", company: "Umbrella Health" },
  { id: "cust-05", name: "Sofia Reyes", company: "Northwind Traders" },
  { id: "cust-06", name: "James Whitfield", company: "Stark Logistics" },
  { id: "cust-07", name: "Hannah Kim", company: "Wayne Analytics" },
  { id: "cust-08", name: "Tomasz Nowak", company: "Cyberdyne Systems" },
  { id: "cust-09", name: "Aisha Malik", company: "Hooli Cloud" },
  { id: "cust-10", name: "Lucas Ferreira", company: "Vandelay Imports" },
  { id: "cust-11", name: "Emily Chen", company: "Pied Piper Networks" },
  { id: "cust-12", name: "Robert Ellison", company: "Massive Dynamic" },
  { id: "cust-13", name: "Fatima Al-Rashid", company: "Aperture Labs" },
  { id: "cust-14", name: "George Papadopoulos", company: "Wonka Retail Group" },
  { id: "cust-15", name: "Ingrid Larsson", company: "Tyrell Biotech" },
  { id: "cust-16", name: "Kwame Mensah", company: "Soylent Foods" },
  { id: "cust-17", name: "Natalie Dubois", company: "Oscorp Media" },
  { id: "cust-18", name: "Victor Huang", company: "Zorg Enterprises" },
];

export const ASSIGNEES: Assignee[] = [
  { id: "user-01", name: "Amjad Ali" },
  { id: "user-02", name: "Sara Thompson" },
  { id: "user-03", name: "Bilal Hussain" },
  { id: "user-04", name: "Rachel Green" },
  { id: "user-05", name: "Omar Farouk" },
  { id: "user-06", name: "Jessica Liu" },
  { id: "user-07", name: "David Martinez" },
  { id: "user-08", name: "Zainab Qureshi" },
  { id: "user-09", name: "Michael O'Brien" },
];

const TITLE_TEMPLATES = [
  "Renewal call with {customer}",
  "Prepare QBR deck for {customer}",
  "Escalation: login issues at {customer}",
  "Follow up on NPS feedback from {customer}",
  "Onboarding kickoff for {customer}",
  "Investigate usage dip at {customer}",
  "Draft success plan for {customer}",
  "Expansion conversation with {customer}",
  "Resolve invoice discrepancy for {customer}",
  "Health check sync with {customer}",
  "Churn-risk review: {customer}",
  "Admin training session for {customer}",
  "Migrate {customer} to new billing plan",
  "Collect case-study approval from {customer}",
  "Review open support tickets for {customer}",
  "Schedule executive sponsor intro at {customer}",
  "Feature adoption audit for {customer}",
  "Contract amendment follow-up with {customer}",
  "Share Q3 roadmap update with {customer}",
  "Re-engage dormant users at {customer}",
];

const DESCRIPTIONS = [
  "Customer flagged this during the last sync. Needs a clear owner and a follow-up date before the next check-in.",
  "Raised via support ticket #{n}. The account team asked CS to drive this to resolution and report back.",
  "Part of the quarterly success-plan commitments. Blocked until we hear back from their admin.",
  "High-visibility item for this account — their exec sponsor is watching the outcome closely.",
  "Routine follow-up. Confirm status with the customer contact and close out if no response within a week.",
  "Identified during the health-score review. Usage trend suggests we should act before renewal.",
  "The customer requested this explicitly in the last QBR. Deliverable owed from our side.",
  "Internal action item from the escalation retro. Coordinate with product before responding.",
];

const LONG_TITLE_INDEXES = new Set([10, 40, 80, 130, 170]);
const LONG_TITLES = [
  "Coordinate cross-functional escalation response for the recurring SSO authentication failures affecting the entire EMEA user base at {customer}, including a written RCA and remediation timeline",
  "Prepare and deliver the annual executive business review covering adoption metrics, support history, expansion opportunities, and the multi-year success roadmap for {customer}",
  "Audit all provisioned-but-inactive seats across every business unit at {customer} and build a re-engagement campaign proposal with the marketing team before the renewal conversation",
  "Reconcile the conflicting billing records between the legacy contract and the mid-term upgrade amendment for {customer}, then document the agreed final position for finance",
  "Draft, review, and circulate the joint press-release and case-study package celebrating the two-year partnership milestone with {customer}, pending their legal team's approval",
];
const LONG_DESCRIPTION =
  "This item has an unusually long history. It began as a routine check-in note and grew into a multi-stakeholder workstream spanning support, product, finance, and the customer's own IT leadership. " +
  "Key context: the original request was raised nearly a quarter ago, has changed owners twice, and now carries an executive-visibility flag on both sides. " +
  "Before taking any action, read the full thread in the shared channel, confirm the current single-threaded owner, and verify that the proposed resolution still matches what was last communicated to the customer. " +
  "Any update here should be summarized back to the account team so the next QBR deck reflects the true state of the work rather than the stale summary currently in the deck template.";

const NULL_ASSIGNEE_INDEXES = new Set([7, 55, 120]);

const TOTAL_TASKS = 180;

function generateTasks(): Task[] {
  const today = startOfDay(new Date());
  const tasks: Task[] = [];

  for (let i = 0; i < TOTAL_TASKS; i++) {
    const customer = pick(CUSTOMERS);
    // Cycle through every priority × status combination.
    const priority = PRIORITIES[i % PRIORITIES.length];
    const status =
      STATUSES[Math.floor(i / PRIORITIES.length) % STATUSES.length];

    // Due-date buckets: overdue / today / this week / this month / far future.
    let dueDate: Date;
    switch (i % 5) {
      case 0:
        dueDate = subDays(today, int(1, 30));
        break;
      case 1:
        dueDate = setHours(today, 17);
        break;
      case 2:
        dueDate = addDays(today, int(1, 7));
        break;
      case 3:
        dueDate = addDays(today, int(8, 30));
        break;
      default:
        dueDate = addDays(today, int(31, 120));
    }

    const title = LONG_TITLE_INDEXES.has(i)
      ? LONG_TITLES[int(0, LONG_TITLES.length - 1)].replace(
          "{customer}",
          customer.company ?? customer.name,
        )
      : pick(TITLE_TEMPLATES).replace(
          "{customer}",
          customer.company ?? customer.name,
        );

    const description = LONG_TITLE_INDEXES.has(i)
      ? LONG_DESCRIPTION
      : pick(DESCRIPTIONS).replace("{n}", String(int(1000, 9999)));

    const createdAt = subDays(today, int(5, 90));

    tasks.push({
      id: `task-${String(i + 1).padStart(3, "0")}`,
      title,
      description,
      customer,
      priority,
      status,
      dueDate: dueDate.toISOString(),
      assignee: NULL_ASSIGNEE_INDEXES.has(i) ? null : pick(ASSIGNEES),
      createdAt: createdAt.toISOString(),
      updatedAt: subDays(today, int(0, 4)).toISOString(),
    });
  }

  return tasks;
}

export const seedTasks: Task[] = generateTasks();
