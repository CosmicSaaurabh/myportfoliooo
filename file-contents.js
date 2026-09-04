// file-contents.js — single source of truth for all portfolio content.
// Consumed by ide-shell.js (editor renderers) and, later, terminal.js (Phase 2).

export const about = {
  markdown: `# Saurabh Mishra
### Backend Engineer — Distributed Systems

Backend Software Engineer with 4+ years building large-scale, cloud-native backend systems in Java, Golang, and distributed architectures. Currently scaling backend infrastructure for 10M+ users at Capslock Marketplaces, redesigning services around Kafka-driven async processing and Redis/Postgres caching. Previously shipped performance-critical Couchbase SDK enhancements sustaining ~10K ops/sec with zero failures.

My distributed-systems knowledge isn't just theory — it's Raft consensus and replica routing shipped inside Couchbase SDKs that enterprises run in production, and a Postgres-backed durable task queue I built from scratch that survives worker failure with zero duplicate execution.

I'm genuinely restless about learning: I'm currently deepening my AI/ML and generative AI foundations through a part-time M.Sc. at BITS Pilani, while shipping backend systems by day — new tech doesn't scare me, it's the whole reason I do this.

## Facts

- **Experience:** 4+ years
- **Users served:** 10M+
- **SDK throughput:** ~10K ops/sec, zero failures
- **Problems solved:** 2000+ across competitive programming platforms
- **Currently learning:** AI/ML, GenAI — M.Sc. @ BITS Pilani

## Education

### M.Sc., Artificial Intelligence & Machine Learning — BITS Pilani (Part-time)
2026 – 2028 (Expected)
- Coursework spanning machine learning, deep learning, and generative AI while working full-time as a backend engineer.

### B.Tech., Computer Science (Information Technology) — ABES Engineering College, Ghaziabad
2018 – 2022
- Core coursework: Data Structures & Algorithms, Computer Architecture & Organization, DBMS, AI/ML, Java, Web Development, and Software Project Management.
- Graduated with an overall 8.1 CGPA.

### Senior Secondary & Secondary (Science — PCM) — MPVM, Allahabad
2015 – 2018
- 10 CGPA in Class X, 84% in Class XII.

## Volunteering

### Django Developer Intern — Shiksha Sopan, IIT Kanpur
Apr 2022 – May 2022
- Volunteered as a Django developer supporting Shiksha Sopan's education-access initiatives out of IIT Kanpur.

[Download résumé](assets/Saurabh_Mishra_Resume.pdf)`,
};

export const experience = [
  {
    id: "capslock", company: "Capslock Marketplaces", role: "SDE II",
    period: "Mar 2026 – Present", location: "Bangalore", tag: "Current",
    highlights: [
      { type: "feat", scope: "voicelcub", subject: "own backend serving 10M+ users", body: "Own backend for the Voicelcub app — 10M+ users, scalability, async processing, real-time partner analytics." },
      { type: "perf", scope: "kafka", subject: "move blocking sync calls to async processing", body: "Diagnosed a request-pileup from blocking sync calls; re-architected onto Kafka async processing, clearing a peak-load bottleneck." },
      { type: "feat", scope: "telephony", subject: "integrate TeleCMI cloud calling + OTPless auth", body: "Integrated TeleCMI cloud telephony + OTPless auth, powering reliable call connectivity and frictionless partner onboarding." },
      { type: "perf", scope: "kafka", subject: "scale topic partitions, cut consumer lag", body: "Scaled Kafka topic partitions to improve consumer parallelism, cutting consumer lag during traffic spikes." },
      { type: "perf", scope: "redis", subject: "widen caching in front of postgres", body: "Widened Redis caching in front of Postgres, cutting read latency and DB load on high-traffic endpoints." },
      { type: "feat", scope: "analytics", subject: "live partner dashboard via redis sorted sets", body: "Built a live partner analytics dashboard (income, call volume) using Redis sorted sets for real-time rankings." },
    ],
  },
  {
    id: "couchbase", company: "Couchbase", role: "Software Engineer II",
    period: "Aug 2022 – Mar 2026", location: "Bangalore", tag: "Promoted SE → SE II",
    highlights: [
      { type: "feat", scope: "sdk", subject: "ship enhancements sustaining ~10K ops/sec, zero failures", body: "Shipped customer-facing enhancements to Java & .NET SDKs, sustaining ~10K ops/sec with zero failures." },
      { type: "fix", scope: "sdk", subject: "resolve timeout escalations under private endpoints", body: "Redesigned SDK network heuristics and connection resolution under private endpoint deployments, resolving timeout escalations across Kubernetes and multi-cloud environments." },
      { type: "fix", scope: "sdk", subject: "eliminate OOM via threading + memory redesign", body: "Eliminated OOM issues via optimized threading, memory management, and event-driven design — cutting customer escalations." },
      { type: "feat", scope: "telemetry", subject: "publish SDK runtime metrics for observability", body: "Designed & built Application Telemetry so SDKs publish runtime metrics for observability and diagnostics." },
      { type: "feat", scope: "sdk", subject: "integrate vector search for AI/ML workloads", body: "Integrated Vector Search into SDKs, enabling similarity search for AI/ML workloads." },
      { type: "perf", scope: "routing", subject: "zone-aware replica routing cuts read latency", body: "Built Zone-Aware Replica routing, improving data locality and cutting read latency in distributed deployments." },
      { type: "fix", scope: "rebalancing", subject: "critical memory leak + node-targeting bugs", body: "Fixed critical rebalancing defects: memory leaks and node-targeting bugs under production load." },
      { type: "test", scope: "sdk", subject: "proxy for request interception + replay testing", body: "Built a custom proxy between SDK and server to intercept, manipulate, and replay requests for resilience testing." },
    ],
  },
  {
    id: "orange-health", company: "Orange Health (Logistics)", role: "Software Engineer",
    period: "Jun 2022 – Aug 2022", location: "Bangalore", tag: "",
    highlights: [
      { type: "perf", scope: "logistics", subject: "cut field-medic travel distance ~50%", body: "Cut field-medic travel distance ~50% via Google Maps API integration and route optimization." },
      { type: "feat", scope: "logistics", subject: "real-time visibility + coordination APIs", body: "Designed real-time logistics APIs improving visibility and coordination across stakeholders." },
    ],
  },
  {
    id: "instaastro", company: "InstaAstro", role: "Software Engineer Intern",
    period: "Feb 2022 – Jun 2022", location: "Noida", tag: "",
    highlights: [
      { type: "feat", scope: "api", subject: "core web + mobile backend APIs", body: "Built backend APIs for core web and mobile features." },
      { type: "chore", scope: "api", subject: "align backend design with product requirements", body: "Partnered with frontend + product to translate requirements into scalable backend solutions." },
    ],
  },
  {
    id: "shiksha-sopan", company: "Shiksha Sopan, IIT Kanpur", role: "Django Developer Intern (Volunteer)",
    period: "Apr 2022 – May 2022", location: "Kanpur (remote)", tag: "Volunteering",
    highlights: [
      { type: "chore", scope: "django", subject: "volunteer on education-access initiatives", body: "Volunteered as a Django developer supporting Shiksha Sopan's education-access initiatives out of IIT Kanpur." },
      { type: "feat", scope: "django", subject: "outreach + program tooling backend features", body: "Built backend features to support the organization's outreach and program tooling." },
    ],
  },
];

export const projects = [
  {
    id: "sentinel-engine", featured: true, title: "Sentinel Engine", subtitle: "Distributed Workflow Orchestration Engine",
    timeframe: "Personal project", github: "https://github.com/CosmicSaaurabh/sentinel-engine", repoStatus: "public",
    language: { name: "Java", color: "#e76f00" },
    tags: ["Java 21", "Spring Boot 3", "PostgreSQL", "gRPC", "Protobuf", "Docker", "OpenTelemetry", "Prometheus", "Grafana", "Testcontainers"],
    summary: "A Temporal-style durable workflow engine that runs multi-step task DAGs with effectively-once semantics and survives worker and network failures.",
    role: "Sole architect and engineer — designed the durable-execution model, built the task queue, scheduler, failure-recovery layer, and the observability stack around it.",
    architecture: `                 ┌────────────┐
   Client  ────▶ │   Engine   │◄──────── heartbeat ────────┐
                 └─────┬──────┘                            │
                       │ enqueue                            │
                       ▼                                    │
                 ┌────────────┐   lease check         ┌─────┴──────┐
                 │  Postgres  │ ────────────────────▶ │   Reaper   │
                 │   Queue    │                        │ (failover) │
                 └─────┬──────┘                        └────────────┘
                       │ SELECT FOR UPDATE SKIP LOCKED
                       ▼
                 ┌────────────┐
                 │  Workers   │
                 │ (N replicas)│
                 └────────────┘`,
    architectureNotes: [
      "Postgres queue removes the need for a separate message broker — one durable store for state and work.",
      "Reaper watches leases via a side-channel heartbeat, not the main dispatch path — failure detection never blocks throughput.",
      "Workers claim rows lock-free (SKIP LOCKED), so adding replicas scales dispatch linearly.",
    ],
    architectureList: [
      "Postgres-backed durable task queue built on SELECT FOR UPDATE SKIP LOCKED for lock-free concurrent claims across workers.",
      "DAG scheduler with cycle detection and dependency-aware dispatch, driving multi-step workflows through their task graph.",
      "Lease-based failure recovery using fencing tokens, so a recovered task can never double-execute after a worker dies mid-lease.",
      "Distributed tracing via OpenTelemetry with Grafana dashboards for live visibility into dispatch latency and queue depth.",
    ],
    challenges: [
      { problem: "Guaranteeing zero duplicate task execution when many workers claim from the same queue under load.", solution: "Used SELECT FOR UPDATE SKIP LOCKED for contention-free row claiming and validated correctness with 50 concurrent workers against 100K+ tasks — zero duplicate claims.", label: "bug" },
      { problem: "A worker dying mid-task shouldn't corrupt state or let two workers finish the same step.", solution: "Added lease-based ownership with fencing tokens: a recovered task can only be re-executed once its fencing token invalidates any stale in-flight writer.", label: "bug" },
      { problem: "Keeping dispatch latency predictable as task graphs grew deeper and wider.", solution: "Built a dependency-aware scheduler that only dispatches tasks whose upstream DAG nodes are complete, sustaining 1,000+ transitions/sec at p99 dispatch latency under 500ms.", label: "perf" },
    ],
    metrics: [
      { value: "100K+", label: "tasks validated" },
      { value: "50", label: "concurrent workers, zero dupes" },
      { value: "1,000+/s", label: "task transitions" },
      { value: "<500ms", label: "p99 dispatch latency" },
    ],
  },
  {
    id: "distributed-kv-store", featured: true, title: "Distributed Key-Value Store", subtitle: "Redis-compatible store in Go + Rust",
    timeframe: "Personal project", github: "https://github.com/CosmicSaaurabh/redis-from-scratch", repoStatus: "public",
    language: { name: "Go", color: "#00ADD8" },
    tags: ["Go", "Rust", "gRPC", "Raft", "RESP Protocol", "LSM-Tree", "Protobuf", "Docker", "Kubernetes"],
    summary: "A distributed, Redis-compatible key-value store built from scratch — RESP protocol, Raft consensus, and a Rust storage engine underneath a Go coordination layer.",
    role: "Designed and built both halves of the system solo: the Go coordination/consensus layer and the Rust storage engine, plus the gRPC bridge between them.",
    architecture: `  Client (RESP)
       │
       ▼
 ┌────────────┐      Raft       ┌────────────┐
 │   Node A   │◄───────────────▶│   Node B   │
 │  (leader)  │                 │ (follower) │
 └─────┬──────┘                 └────────────┘
       │ gRPC
       ▼
 ┌────────────┐
 │Rust Engine │
 │ WAL + LSM  │
 └────────────┘`,
    architectureNotes: [
      "The Go layer speaks Raft and RESP; the Rust engine only ever sees gRPC calls — a clean boundary between coordination and storage.",
      "Followers replicate via Raft, so a leader crash triggers automatic election without client-visible downtime.",
      "WAL + LSM-tree in Rust keeps the write path outside Go's garbage collector entirely.",
    ],
    architectureList: [
      "RESP protocol implementation so the store speaks the Redis wire protocol directly to existing clients.",
      "Raft consensus across a 5-node cluster with configurable linearizable or eventual consistency and automatic leader failover.",
      "A Rust storage engine — write-ahead log, LSM-tree, background compaction — kept out of the Go process to avoid GC-induced write-path latency.",
      "Go and Rust communicate over gRPC, isolating consensus/coordination concerns from low-level storage.",
      "Horizontal sharding with a custom benchmarking harness to validate throughput and failover under chaos testing.",
    ],
    challenges: [
      { problem: "Go's garbage collector introduces write-path latency spikes that a storage engine can't tolerate.", solution: "Moved the hot storage path (WAL + LSM-tree + compaction) into Rust, exposed to the Go layer over gRPC — keeping GC pauses out of the write path entirely.", label: "perf" },
      { problem: "Leader failure needs to be invisible to clients as much as possible.", solution: "Implemented Raft-driven automatic failover, achieving sub-2s leader election under chaos testing while sustaining 8,000+ writes/sec.", label: "design" },
      { problem: "Validating correctness and throughput without a production cluster to test against.", solution: "Built a custom benchmarking and chaos-testing harness that injects node failures and network partitions on demand.", label: "design" },
    ],
    metrics: [
      { value: "8,000+/s", label: "sustained writes" },
      { value: "<2s", label: "automatic leader failover" },
      { value: "5-node", label: "Raft cluster" },
      { value: "2", label: "languages, one storage path" },
    ],
  },
  {
    id: "ecommerce-platform", featured: true, title: "Microservices E-Commerce Platform", subtitle: "Clean Architecture + CQRS across independent services",
    timeframe: "Personal project", github: "https://github.com/Softogram/mvc-ecomm-net", repoStatus: "public",
    language: { name: "C#", color: "#512BD4" },
    tags: [".NET", "Kubernetes", "RabbitMQ", "gRPC", "MongoDB", "PostgreSQL", "Redis", "Angular", "Elasticsearch"],
    summary: "An end-to-end microservices e-commerce platform with independent services for user management, catalog, orders, payments, and checkout, running Clean Architecture and CQRS with event-driven workflows.",
    role: "Designed and built the platform end-to-end — service boundaries, the Saga-based checkout flow, the API gateway, and the observability stack around the cluster.",
    architecture: `      Client
        │
        ▼
  ┌────────────┐
  │ API Gateway│
  │  (Ocelot)  │
  └──────┬─────┘
     ┌────┼─────────┬────────────┐
     ▼    ▼          ▼            ▼
 ┌─────┐┌────────┐┌────────┐┌──────────┐
 │Users││Catalog ││ Orders ││ Payments │
 └─────┘└────────┘└───┬────┘└────┬─────┘
                       └─ Saga (RabbitMQ) ┘`,
    architectureNotes: [
      "One gateway in front of five independently deployable services — each owns its own datastore.",
      "Orders and Payments coordinate through a RabbitMQ Saga instead of a distributed transaction.",
      "Elasticsearch + Kibana sit behind the gateway, centralizing logs across every service.",
    ],
    architectureList: [
      "Independent services per domain (users, catalog, orders, payments, checkout) each owning their own data store — MongoDB, PostgreSQL, and Redis chosen per service's access pattern.",
      "Clean Architecture and CQRS inside each service, separating read and write models.",
      "Event-driven checkout via RabbitMQ using the Saga pattern, coordinating multi-step order/payment workflows without a distributed transaction.",
      "Real-time discount application over gRPC with Redis-backed basket state.",
      "API Gateway (Ocelot) fronting all services, with Elasticsearch + Kibana for centralized logging.",
      "Kubernetes deployment for service isolation and independent scaling; Angular frontend consuming the gateway.",
    ],
    challenges: [
      { problem: "A checkout that touches orders, payments, and inventory can't use a single database transaction across services.", solution: "Implemented the Saga pattern over RabbitMQ: each step publishes an event and compensating actions roll back prior steps on failure.", label: "design" },
      { problem: "Applying discounts at checkout needs to be fast and consistent with the live basket.", solution: "Served discount calculation over gRPC backed by a Redis basket cache, keeping pricing latency low.", label: "perf" },
      { problem: "Debugging a request that crosses five independent services is hard without centralized visibility.", solution: "Centralized all service logs into Elasticsearch with Kibana dashboards, and put an Ocelot API Gateway in front so every request has one entry point to trace from.", label: "design" },
    ],
    metrics: [
      { value: "5", label: "independent services" },
      { value: "3", label: "datastores (Mongo/Postgres/Redis)" },
      { value: "CQRS", label: "read/write separation" },
      { value: "K8s", label: "deployed & scaled" },
    ],
  },
  {
    id: "splitwise", featured: false, title: "Splitwise-Style Expense Sharing", subtitle: "Settlement-minimizing bill splitter",
    timeframe: "Personal project", github: "https://github.com/CosmicSaaurabh/splitwise-app", repoStatus: "public",
    language: { name: "Java", color: "#e76f00" },
    tags: ["Java", "Spring Boot", "PostgreSQL", "Algorithms", "JWT"],
    summary: "An intelligent bill-splitting application that minimizes the number of settlements between users while preserving total balances, using a Maximum Flow algorithm.",
    role: "Built solo, end to end — the settlement algorithm, the Spring Boot backend, authentication, and the group/expense data model.",
    architecture: `   Client
     │
     ▼
 ┌────────────┐
 │ Spring Boot│
 │    API     │
 └─────┬──────┘
       │
       ▼
 ┌────────────┐      ┌───────────────┐
 │  Postgres  │◄────▶│  Max-Flow     │
 │   Ledger   │      │  Settlement   │
 └────────────┘      └───────────────┘`,
    architectureNotes: [
      "The ledger is the source of truth; settlements are recomputed from it, never patched incrementally.",
      "Max-Flow runs against the ledger's net balances, not the raw expense list — that's what keeps transaction counts low.",
    ],
    architectureList: [
      "Group and expense data model in PostgreSQL tracking who paid, who owes, and per-group running balances.",
      "Settlement engine modeled as a Maximum Flow problem, computing the minimum set of payments needed to zero out all balances in a group.",
      "JWT-based authentication securing all API routes, with full CRUD workflows for groups, members, and expenses.",
      "REST API layer in Spring Boot separating expense entry from the settlement computation.",
    ],
    challenges: [
      { problem: "Naively settling every pairwise debt in a group produces far more transactions than necessary.", solution: "Modeled net balances as a flow network and applied a Maximum Flow-based reduction, cutting settlements to the minimum needed.", label: "perf" },
      { problem: "Balances must stay exactly consistent as expenses are added, edited, or deleted.", solution: "Recomputed net balances from the full expense ledger on every mutation rather than incrementally patching state.", label: "bug" },
      { problem: "API routes needed to be secure without adding session-management overhead.", solution: "Used stateless JWT authentication, so any service instance can validate a request without shared session storage.", label: "design" },
    ],
    metrics: [
      { value: "Max Flow", label: "settlement algorithm" },
      { value: "JWT", label: "stateless auth" },
      { value: "Full", label: "CRUD workflows" },
      { value: "Spring Boot", label: "REST backend" },
    ],
  },
  {
    id: "wediscusscp", featured: false, title: "WeDiscussCP", subtitle: "A blogging & discussion platform for competitive programmers",
    timeframe: "Personal project", github: "https://github.com/CosmicSaaurabh/WediscussCp", repoStatus: "public",
    language: { name: "PHP", color: "#4F5B93" },
    tags: ["PHP", "MySQL", "Bootstrap", "HTML", "CSS"],
    summary: "A community blogging platform where competitive programmers write up problem breakdowns, editorials, and contest experiences, with threaded discussion on each post.",
    role: "Built solo, end to end — the content model, authoring flow, and the discussion/comment system.",
    architecture: `  Client (Bootstrap UI)
        │
        ▼
  ┌────────────┐
  │    PHP     │
  │  Backend   │
  └──────┬─────┘
         │
         ▼
  ┌────────────────────┐
  │       MySQL         │
  │ Posts / Comment tree│
  └────────────────────┘`,
    architectureNotes: [
      "Comments are stored as a parent-referencing tree in MySQL, so nested replies are a query, not a UI hack.",
      "Server-rendered PHP views keep the stack simple — no separate API layer to maintain.",
    ],
    architectureList: [
      "Full-stack blog platform: a PHP backend rendering server-side views, styled with Bootstrap, HTML, and CSS.",
      "MySQL relational schema for posts, comments, and user profiles, with foreign-key relations for threaded discussions.",
      "Authenticated authoring flow so writers can draft, edit, and publish posts with per-post comment threads.",
    ],
    challenges: [
      { problem: "Threaded comments need to render nested replies without the UI turning into a wall of indentation.", solution: "Modeled comments as a parent-referencing tree in MySQL and capped visual nesting depth on the frontend.", label: "design" },
      { problem: "Writers needed a low-friction way to publish technical write-ups with code snippets.", solution: "Built a markdown-friendly editor with code-block support so editorials read like the write-ups competitive programmers are used to.", label: "design" },
    ],
    metrics: [
      { value: "PHP", label: "server-rendered" },
      { value: "Threaded", label: "discussion model" },
      { value: "MySQL", label: "relational data" },
      { value: "Solo", label: "build" },
    ],
  },
  {
    id: "ctrlbudget", featured: false, title: "CtrlBudget", subtitle: "Personal budget & expense management app",
    timeframe: "Personal project", github: "https://github.com/CosmicSaaurabh/CtRlbudget", repoStatus: "public",
    language: { name: "Python", color: "#3572A5" },
    tags: ["Python", "Django", "PostgreSQL"],
    summary: "A personal finance app for tracking income, expenses, and budgets by category, with a dashboard view of where money is actually going each month.",
    role: "Built solo — the budgeting data model, category-based expense tracking, and the dashboard summarizing spend against budget.",
    architecture: `  Client
    │
    ▼
 ┌────────────┐
 │   Django   │
 └─────┬──────┘
       │
       ▼
 ┌────────────────┐
 │  PostgreSQL     │
 │ Txns / Budgets  │
 └────────────────┘`,
    architectureNotes: [
      "Aggregation queries run server-side in Postgres, so the dashboard stays fast without client-side rollups.",
      "Recurring and one-off transactions share one schema, keeping reporting logic in one place.",
    ],
    architectureList: [
      "Django backend rendering the budgeting dashboard and handling transaction entry.",
      "PostgreSQL schema modeling transactions, categories, and monthly budgets per user.",
      "Aggregation queries roll transactions up into category and monthly summaries for the dashboard view.",
    ],
    challenges: [
      { problem: "Users need to see budget-vs-actual at a glance, not just a raw transaction list.", solution: "Built category- and month-scoped aggregation queries that compute spend-to-budget ratios server-side.", label: "design" },
      { problem: "Recurring and one-off transactions both need to fit the same data model without special-casing everything.", solution: "Kept a single transaction schema with an optional recurrence field, reusing the same aggregation and reporting logic.", label: "design" },
    ],
    metrics: [
      { value: "Category", label: "budget tracking" },
      { value: "Monthly", label: "spend dashboard" },
      { value: "Django", label: "backend" },
      { value: "Solo", label: "build" },
    ],
  },
];

export const skills = {
  languages: [
    { name: "Java", depth: "expert", usedAt: ["Couchbase", "Personal projects"], blurb: "Primary language for 3+ years of Couchbase SDK work — concurrency, memory management, JVM performance tuning." },
    { name: "Go", depth: "proficient", usedAt: ["Capslock Marketplaces", "Distributed KV Store"], blurb: "Coordination layer for Voicelcub backend services and the Raft-based distributed KV store." },
    { name: ".NET / C#", depth: "proficient", usedAt: ["Couchbase", "E-Commerce platform"], blurb: "Couchbase .NET SDK internals, plus the microservices e-commerce project." },
    { name: "Python", depth: "proficient", usedAt: ["CtrlBudget", "Personal tooling"], blurb: "Django backend for CtrlBudget, scripting, and ML coursework." },
    { name: "Rust", depth: "working", usedAt: ["Distributed KV Store"], blurb: "Built the storage engine (WAL, LSM-tree, compaction) to keep GC pauses out of the write path." },
    { name: "C++", depth: "working", usedAt: ["Competitive programming"], blurb: "Primary language across 2,000+ competitive programming problems." },
  ],
  backend: [
    { name: "Distributed Systems", depth: "expert", usedAt: ["Couchbase", "Sentinel Engine", "Distributed KV Store"], blurb: "Consensus (Raft), durable execution, replica routing, and failure recovery across production and personal systems." },
    { name: "Microservices", depth: "proficient", usedAt: ["Capslock Marketplaces", "E-Commerce platform"], blurb: "Service decomposition, independent scaling, and per-service data ownership." },
    { name: "Event-Driven (Kafka/RabbitMQ)", depth: "proficient", usedAt: ["Capslock Marketplaces", "E-Commerce platform"], blurb: "Async request handling under peak load, and Saga-pattern checkout workflows." },
    { name: "System Design at Scale", depth: "expert", usedAt: ["Couchbase", "Capslock Marketplaces"], blurb: "Designing for 10M+ users and SDKs sustaining ~10K ops/sec with zero failures." },
  ],
  cloud_devops: [
    { name: "Kubernetes / Docker", depth: "proficient", usedAt: ["E-Commerce platform", "Distributed KV Store"], blurb: "Deployment, scaling, and sharding for both personal systems projects." },
    { name: "AWS / Azure", depth: "proficient", usedAt: ["Couchbase", "Capslock Marketplaces"], blurb: "Cloud-native deployment targets for SDKs and backend services." },
    { name: "CI/CD Pipelines", depth: "proficient", usedAt: ["Couchbase", "Personal projects"], blurb: "Build, test, and release pipelines for multi-language SDK artifacts and containerised services." },
    { name: "Terraform / IaC", depth: "working", usedAt: ["Couchbase", "Personal projects"], blurb: "Declarative provisioning of cloud infrastructure and test environments rather than console clicks." },
  ],
  databases: [
    { name: "Postgres / MySQL", depth: "proficient", usedAt: ["Sentinel Engine", "Splitwise"], blurb: "Postgres as a durable task queue (SELECT FOR UPDATE SKIP LOCKED) and relational data for expense tracking." },
    { name: "Redis", depth: "proficient", usedAt: ["Capslock Marketplaces", "E-Commerce platform"], blurb: "Caching layer in front of Postgres, sorted sets for live analytics, gRPC-backed basket state." },
    { name: "MongoDB", depth: "working", usedAt: ["E-Commerce platform"], blurb: "Per-service document store for catalog and order data." },
    { name: "Couchbase", depth: "expert", usedAt: ["Couchbase"], blurb: "Three years deep in the SDKs enterprises use to talk to Couchbase clusters." },
  ],
  specializations: [
    { name: "Prometheus / Grafana", depth: "working", usedAt: ["Sentinel Engine"], blurb: "Dashboards for dispatch latency and queue depth on the workflow engine." },
    { name: "OpenTelemetry", depth: "proficient", usedAt: ["Couchbase", "Sentinel Engine"], blurb: "Distributed tracing and Application Telemetry design at Couchbase." },
    { name: "Performance Optimization", depth: "expert", usedAt: ["Couchbase", "Capslock Marketplaces"], blurb: "SDK network heuristics sustaining 10K ops/sec; Kafka/Redis re-architecture clearing production bottlenecks." },
    { name: "Production Debugging", depth: "expert", usedAt: ["Couchbase"], blurb: "Resolved critical rebalancing defects — memory leaks and node-targeting bugs under live production load." },
  ],
};

export const achievements = [
  { ts: "2026-03-01 09:00:00", level: "INFO", text: "Promoted to Software Engineer II at Couchbase for high-impact SDK contributions." },
  { ts: "2023-11-14 21:00:00", level: "INFO", text: "Ranked 663rd globally among 25,000+ participants in a Codeforces contest." },
  { ts: "2021-10-02 18:30:00", level: "INFO", text: "Finalist, TechGig Code Gladiators 2021." },
  { ts: "2021-06-19 20:00:00", level: "INFO", text: "Secured 1st place in Turing Test 6 coding competition (300+ teams)." },
  { ts: "2022-05-30 12:00:00", level: "INFO", text: "Graduated B.Tech, Computer Science, ABES Engineering College — 8.1 CGPA overall." },
  { ts: "2026-07-27 08:00:00", level: "INFO", text: "Solved 2,000+ algorithm and data structure problems across competitive programming platforms." },
  { ts: "2026-08-16 12:00:00", level: "INFO", text: "Earned LeetCode's Knight contest badge — rating in the top 2% of all ranked users (peak rating 2091)." },
];

export const codingProfiles = [
  { name: "LeetCode", url: "https://leetcode.com/doodlemaster/", icon: "https://cdn.simpleicons.org/leetcode", statValue: "2091", statLabel: "Max rating", badge: { name: "Knight", icon: "https://leetcode.com/static/images/badges/knight.png" } },
  { name: "CodeChef Competitive Programming", url: "https://www.codechef.com/users/doodlemaster", icon: "https://cdn.simpleicons.org/codechef/a6e22e", statValue: "1964", statLabel: "Max rating (4★)" },
  { name: "CodeChef DSA", url: "https://www.codechef.com/users/doodlemaster?rating=dsa-monday", icon: "https://cdn.simpleicons.org/codechef/a6e22e", statValue: "1964", statLabel: "Max rating (4★)" },
  { name: "Codeforces", url: "https://codeforces.com/profile/saurabhmishra16/", icon: "https://cdn.simpleicons.org/codeforces", statValue: "1527", statLabel: "Max rating" },
  { name: "HackerRank", url: "https://www.hackerrank.com/vector07?hr_r=1", icon: "https://cdn.simpleicons.org/hackerrank/2ec866", statValue: "6★", statLabel: "Problem solving" },
  { name: "AtCoder", url: "https://atcoder.jp/users/doodlemaster", icon: null, statValue: "1018", statLabel: "Max rating" },
  { name: "HackerEarth", url: "https://www.hackerearth.com/@eklavya12", icon: "https://cdn.simpleicons.org/hackerearth", statValue: "1523", statLabel: "Max rating" },
];

export const contact = {
  email: "swe.saurabh.mishra@gmail.com",
  linkedin: "https://www.linkedin.com/in/2bsaurabh/",
  github: "https://github.com/CosmicSaaurabh",
  phone: "+91 6393783010",
};

export const resumeHref = "assets/Saurabh_Mishra_Resume.pdf";

// ---------------------------------------------------------------------------
// Landing view (README.md). Structured rather than markdown because it renders
// as hero + metric tiles + start-here cards, not as prose.
// ---------------------------------------------------------------------------
export const readme = {
  name: "Saurabh Mishra",
  title: "Backend Engineer — Distributed Systems",
  now: "SDE II @ Capslock Marketplaces",
  prev: "ex-Couchbase",
  years: "4+ years",
  pitch: "I build backend systems that stay correct when things fail. Raft consensus and replica routing shipped inside Couchbase SDKs that enterprises run in production, and a Postgres-backed durable task queue that survives worker death with zero duplicate execution.",
  metrics: [
    { value: "10M+", label: "users served" },
    { value: "~10K/s", label: "SDK ops, zero failures" },
    { value: "4+ yrs", label: "backend engineering" },
    { value: "2000+", label: "DS & algo problems" },
  ],
  startHere: [
    {
      open: "sentinel-sim",
      kicker: "Interactive",
      title: "Kill a worker, watch the invariant hold",
      blurb: "A live simulation of my durable task queue. Kill a worker mid-task, watch the lease expire, the reaper requeue it, and the zombie's late write get rejected by a stale fence token. Duplicate executions never leaves zero.",
    },
    {
      open: "history",
      kicker: "2 min read",
      title: "My career as a git commit graph",
      blurb: "Five roles rendered as git log --graph, one commit per thing I actually shipped. Capslock is the unmerged HEAD branch.",
    },
    {
      open: "sentinel-engine",
      kicker: "Deep dive",
      title: "Sentinel Engine",
      blurb: "A Temporal-style durable workflow engine. Postgres queue via SELECT FOR UPDATE SKIP LOCKED, DAG scheduler with cycle detection, lease-based recovery with fencing tokens.",
    },
  ],
  drive: [
    { keys: "Ctrl/Cmd + K", what: "command palette — jump to any file" },
    { keys: "Ctrl/Cmd + Shift + F", what: "search inside every file" },
    { keys: "Ctrl/Cmd + `", what: "terminal — try help, or git log" },
    { keys: "?", what: "all keyboard shortcuts" },
  ],
};

// ---------------------------------------------------------------------------
// interview.md — pre-loads the questions a reviewer is already forming.
// ---------------------------------------------------------------------------
export const interview = {
  intro: "Things I can go deep on without notes. If you're screening me, these are the fastest routes to a real signal.",
  topics: [
    {
      q: "Why Postgres for a task queue instead of Kafka or Redis?",
      a: "Because the hard requirement was effectively-once execution with transactional handoff, not throughput. SELECT FOR UPDATE SKIP LOCKED lets a worker claim a row and commit its side effects in the same transaction, so a crash between claim and commit is a rollback rather than a lost task. Kafka gives me ordering and throughput I did not need, and at-least-once semantics I would then have to de-duplicate anyway.",
      open: "sentinel-engine",
    },
    {
      q: "A worker hangs, its lease expires, another worker picks up the task — and then the first one wakes up and writes. What stops the duplicate?",
      a: "A monotonically increasing fence token issued with every lease. The late write carries the old token, the store compares it against the current one, and rejects anything stale. Lease expiry alone is not enough because it only bounds how long you wait, not what a zombie does when it returns.",
      open: "sentinel-sim",
    },
    {
      q: "What was actually hard about the Couchbase SDK work?",
      a: "Network behaviour that only appears in customer environments. Private-endpoint deployments across Kubernetes and multiple clouds broke the SDK's connection-resolution assumptions and produced timeout escalations we could not reproduce locally. I built a proxy between the SDK and the server to intercept, manipulate, and replay real request traffic, which turned an unreproducible customer report into a test case.",
      open: "couchbase",
    },
    {
      q: "Why put the storage engine of your KV store in Rust when the rest is Go?",
      a: "To keep the garbage collector off the write path. Go is a good fit for the coordination and Raft layers where I want fast iteration and cheap concurrency, but tail latency on writes was being shaped by GC pauses. Rust gives deterministic memory behaviour for the WAL, LSM-tree, and compaction, and the gRPC bridge between them is a boundary I control.",
      open: "distributed-kv-store",
    },
    {
      q: "You moved a service from synchronous to Kafka-driven async. What broke?",
      a: "The easy part was publishing events. The hard part was that async processing turned a request-scoped failure into a silent backlog — consumer lag became the real health signal, not error rate. I scaled topic partitions to widen consumer parallelism and added Redis caching in front of Postgres so the read path stopped competing with the write path for the same connections.",
      open: "capslock",
    },
    {
      q: "What are you weakest at right now?",
      a: "Frontend depth and formal ML. I can build and ship a UI — this site is hand-written vanilla JS with no build step — but I would not claim frontend as a specialisation. On ML I am deliberately mid-journey: the part-time M.Sc. at BITS Pilani is me closing that gap on purpose rather than pretending it is already closed.",
    },
  ],
};

// ---------------------------------------------------------------------------
// posts/ — technical write-ups.
//
// Only posts with status "published" appear in the file tree, the palette, the
// terminal and the plain view. The three below ship as "draft" on purpose: an
// outline visible on a live hiring portfolio is worse than no post at all.
// Write the prose, flip status to "published", and the post appears everywhere.
// ---------------------------------------------------------------------------
export const posts = [
  {
    id: "skip-locked-vs-advisory-locks",
    status: "draft",
    title: "Why SKIP LOCKED beats advisory locks for a task queue",
    date: "2026-08-25",
    readingMinutes: 7,
    summary: "Both let workers claim work without stepping on each other. Only one of them degrades gracefully at 50 concurrent workers.",
    markdown: `# Why SKIP LOCKED beats advisory locks for a task queue

## The problem in one sentence

N workers, one table, and every task must be executed by exactly one of them.

## What advisory locks look like first

- \`pg_try_advisory_lock(task_id)\` reads as the obvious answer: cheap, non-blocking, explicit.
- Describe the naive loop: SELECT candidate rows, try to lock each one, skip the ones you lose.
- **The point to make here:** the lock lives outside the transaction and outside the row. That decoupling is what eventually bites.

## Where it degrades

- Every worker scans the same head of the queue, so contention rises with worker count rather than staying flat.
- Advisory locks are session-scoped. Describe what actually happens to a held lock when a connection is recycled by a pooler.
- The lock and the row can disagree. Explain the window where a task is locked but its state column says something else.

## What SKIP LOCKED does differently

- \`SELECT ... FOR UPDATE SKIP LOCKED LIMIT n\` pushes the skipping into the executor: contending workers get *different rows*, not failed lock attempts.
- The lock is the row lock, held by the transaction, released by commit or rollback. There is no second thing to keep in sync.
- Show the actual query used in Sentinel Engine.

## The property that made the decision

Claim and side effect commit in the same transaction, so a crash between them is a rollback rather than a lost task.

> Write the concrete failure walk-through here: worker claims task, starts work, process is killed. What the row looks like from another worker's perspective at each step.

## What this still does not give you

Lease expiry hands the task to a new worker, but it does nothing about the old worker waking up and writing.
That needs fencing tokens, which is the next post.

## When I would not use this

- Throughput far beyond what one Postgres can absorb.
- Strict ordering requirements, where a log is the better shape.
- Fan-out to many independent consumers, which is a Kafka problem, not a queue problem.
`,
  },
  {
    id: "fencing-tokens",
    status: "draft",
    title: "Fencing tokens make a zombie worker harmless",
    date: "2026-08-25",
    readingMinutes: 6,
    summary: "Lease expiry bounds how long you wait for a dead worker. It does not bound what that worker does when it comes back.",
    markdown: `# Fencing tokens make a zombie worker harmless

## The race that leases alone do not close

1. Worker A claims task T with a 30s lease.
2. Worker A stalls — GC pause, blocked syscall, network partition. Pick one and describe it concretely.
3. The lease expires. The reaper requeues T. Worker B claims it and starts working.
4. Worker A wakes up, believes it still owns T, and writes.

> The key sentence to land: at step 4 nothing about A's local state is wrong. It has no way to know time passed.

## Why "just check the lease before writing" does not work

- Explain the check-then-act window: the lease can expire between the check and the write.
- Any fix that relies on A noticing its own failure is unsound, because a partitioned A cannot notice anything.

## The fix: make the *receiver* reject stale writes

- Every lease grant increments a monotonic counter for that task.
- The token travels with the worker and is presented on every write.
- The store compares the presented token to the current one and rejects anything lower.

The authority moves from the worker to the resource. A never learns it was fenced, and it does not need to.

## Where the token has to live

- Same transactional store as the task state, or the comparison itself races.
- Note what this rules out: a token cached in application memory, or held in a store that can roll back independently.

## Seeing it happen

The simulation on this site does exactly this — kill a worker, watch the reaper requeue, then watch the late write get rejected with \`fence 4 < current 5\`.

> Add the real log line from your implementation here.

## Prior art worth citing

Martin Kleppmann's fencing-token argument in the "How to do distributed locking" post, and the Chubby paper's sequencers.
Say what you took from each and where your implementation differs.
`,
  },
  {
    id: "zone-aware-replica-routing",
    status: "draft",
    title: "Zone-aware replica routing in a database SDK",
    date: "2026-08-25",
    readingMinutes: 8,
    summary: "Cross-zone reads are correct, cheap to write, and quietly expensive. Here is what changed when the SDK started caring where it was.",
    markdown: `# Zone-aware replica routing in a database SDK

## The default behaviour and why it looks fine

- An SDK picks a replica. Any replica satisfies the read. Correctness is not in question.
- Describe what the latency distribution actually looked like before, and how cross-zone hops showed up in the tail rather than the mean.

## Why the SDK is the right layer for this

- The server does not know which zone the *caller* is in.
- A proxy adds a hop to solve a problem caused by hops.
- **The argument to make:** the client is the only participant that knows both its own location and the full replica topology.

## What the SDK has to learn

- Its own zone, and how it discovers that across cloud providers and Kubernetes.
- The topology, and how often that is allowed to be stale.
- What to do when the local replica is unavailable, which is where the interesting design decisions are.

## The failure modes this introduces

Preferring local replicas is a load-balancing change, not just a latency change.

- Hot-zone skew when clients are unevenly distributed.
- Stale topology after a rebalance sending traffic to a node that no longer holds the replica.
- Describe the fallback path and how quickly it gives up.

## Measuring it honestly

> Put the real before/after numbers here, and be explicit about what you measured: p50 vs p99, which workload, which topology.

## What I would do differently

Leave this section in. It is the part interviewers actually engage with.
`,
  },
];
