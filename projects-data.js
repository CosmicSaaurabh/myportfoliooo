// Shared project data — used by Portfolio.dc.html (cards) and ProjectDetail.dc.html.
// Add/remove a project by editing this array; both pages pick it up automatically.
export default [
  {
    id: "sentinel-engine",
    title: "Sentinel Engine",
    subtitle: "Distributed Workflow Orchestration Engine",
    timeframe: "Personal project",
    tags: ["Java 21", "Spring Boot 3", "PostgreSQL", "gRPC", "Protobuf", "Docker", "OpenTelemetry", "Prometheus", "Grafana", "Testcontainers"],
    github: "https://github.com/CosmicSaaurabh/sentinel-engine",
    summary:
      "A Temporal-style durable workflow engine that runs multi-step task DAGs with effectively-once semantics and survives worker and network failures.",
    role:
      "Sole architect and engineer — designed the durable-execution model, built the task queue, scheduler, failure-recovery layer, and the observability stack around it.",
    architecture: [
      "Postgres-backed durable task queue built on SELECT FOR UPDATE SKIP LOCKED for lock-free concurrent claims across workers.",
      "DAG scheduler with cycle detection and dependency-aware dispatch, driving multi-step workflows through their task graph.",
      "Lease-based failure recovery using fencing tokens, so a recovered task can never double-execute after a worker dies mid-lease.",
      "Distributed tracing via OpenTelemetry with Grafana dashboards for live visibility into dispatch latency and queue depth.",
    ],
    challenges: [
      {
        problem: "Guaranteeing zero duplicate task execution when many workers claim from the same queue under load.",
        solution:
          "Used SELECT FOR UPDATE SKIP LOCKED for contention-free row claiming and validated correctness with 50 concurrent workers against 100K+ tasks — zero duplicate claims.",
      },
      {
        problem: "A worker dying mid-task shouldn't corrupt state or let two workers finish the same step.",
        solution:
          "Added lease-based ownership with fencing tokens: a recovered task can only be re-executed once its fencing token invalidates any stale in-flight writer.",
      },
      {
        problem: "Keeping dispatch latency predictable as task graphs grew deeper and wider.",
        solution:
          "Built a dependency-aware scheduler that only dispatches tasks whose upstream DAG nodes are complete, sustaining 1,000+ transitions/sec at p99 dispatch latency under 500ms.",
      },
    ],
    metrics: [
      { value: "100K+", label: "tasks validated" },
      { value: "50", label: "concurrent workers, zero dupes" },
      { value: "1,000+/s", label: "task transitions" },
      { value: "<500ms", label: "p99 dispatch latency" },
    ],
  },
  {
    id: "distributed-kv-store",
    title: "Distributed Key-Value Store",
    subtitle: "Redis-compatible store in Go + Rust",
    timeframe: "Personal project",
    tags: ["Go", "Rust", "gRPC", "Raft", "RESP Protocol", "LSM-Tree", "Protobuf", "Docker", "Kubernetes"],
    github: "https://github.com/CosmicSaaurabh/redis-from-scratch",
    summary:
      "A distributed, Redis-compatible key-value store built from scratch — RESP protocol, Raft consensus, and a Rust storage engine underneath a Go coordination layer.",
    role:
      "Designed and built both halves of the system solo: the Go coordination/consensus layer and the Rust storage engine, plus the gRPC bridge between them.",
    architecture: [
      "RESP protocol implementation so the store speaks the Redis wire protocol directly to existing clients.",
      "Raft consensus across a 5-node cluster with configurable linearizable or eventual consistency and automatic leader failover.",
      "A Rust storage engine — write-ahead log, LSM-tree, background compaction — kept out of the Go process to avoid GC-induced write-path latency.",
      "Go and Rust communicate over gRPC, isolating consensus/coordination concerns from low-level storage.",
      "Horizontal sharding with a custom benchmarking harness to validate throughput and failover under chaos testing.",
    ],
    challenges: [
      {
        problem: "Go's garbage collector introduces write-path latency spikes that a storage engine can't tolerate.",
        solution:
          "Moved the hot storage path (WAL + LSM-tree + compaction) into Rust, exposed to the Go layer over gRPC — keeping GC pauses out of the write path entirely.",
      },
      {
        problem: "Leader failure needs to be invisible to clients as much as possible.",
        solution:
          "Implemented Raft-driven automatic failover, achieving sub-2s leader election under chaos testing (killed nodes, partitioned networks) while sustaining 8,000+ writes/sec.",
      },
      {
        problem: "Validating correctness and throughput without a production cluster to test against.",
        solution:
          "Built a custom benchmarking and chaos-testing harness that injects node failures and network partitions on demand, used to measure failover time and sustained throughput.",
      },
    ],
    metrics: [
      { value: "8,000+/s", label: "sustained writes" },
      { value: "<2s", label: "automatic leader failover" },
      { value: "5-node", label: "Raft cluster" },
      { value: "2", label: "languages, one storage path" },
    ],
  },
  {
    id: "ecommerce-microservices",
    title: "Microservices E-Commerce Platform",
    subtitle: "Clean Architecture + CQRS across independent services",
    timeframe: "Personal project",
    tags: [".NET", "Kubernetes", "RabbitMQ", "gRPC", "MongoDB", "PostgreSQL", "Redis", "Angular", "Elasticsearch"],
    github: "https://github.com/Softogram/mvc-ecomm-net",
    summary:
      "An end-to-end microservices e-commerce platform with independent services for user management, catalog, orders, payments, and checkout, running Clean Architecture and CQRS with event-driven workflows.",
    role:
      "Designed and built the platform end-to-end — service boundaries, the Saga-based checkout flow, the API gateway, and the observability stack around the cluster.",
    architecture: [
      "Independent services per domain (users, catalog, orders, payments, checkout) each owning their own data store — MongoDB, PostgreSQL, and Redis chosen per service's access pattern.",
      "Clean Architecture and CQRS inside each service, separating read and write models so catalog browsing and order writes scale independently.",
      "Event-driven checkout via RabbitMQ using the Saga pattern, coordinating multi-step order/payment workflows without a distributed transaction.",
      "Real-time discount application over gRPC with Redis-backed basket state for low-latency pricing at checkout.",
      "API Gateway (Ocelot) fronting all services, with Elasticsearch + Kibana for centralized logging across the cluster.",
      "Kubernetes deployment for service isolation, independent scaling, and high availability; Angular frontend consuming the gateway.",
    ],
    challenges: [
      {
        problem: "A checkout that touches orders, payments, and inventory can't use a single database transaction across services.",
        solution:
          "Implemented the Saga pattern over RabbitMQ: each step publishes an event and compensating actions roll back prior steps on failure, keeping the workflow consistent without 2PC.",
      },
      {
        problem: "Applying discounts at checkout needs to be fast and consistent with the live basket.",
        solution:
          "Served discount calculation over gRPC backed by a Redis basket cache, keeping pricing latency low without round-tripping to the catalog service on every change.",
      },
      {
        problem: "Debugging a request that crosses five independent services is hard without centralized visibility.",
        solution:
          "Centralized all service logs into Elasticsearch with Kibana dashboards, and put an Ocelot API Gateway in front so every request has one entry point to trace from.",
      },
    ],
    metrics: [
      { value: "5", label: "independent services" },
      { value: "3", label: "datastores (Mongo/Postgres/Redis)" },
      { value: "CQRS", label: "read/write separation" },
      { value: "K8s", label: "deployed & scaled" },
    ],
  },
  {
    id: "splitwise-expense-sharing",
    title: "Splitwise-Style Expense Sharing",
    subtitle: "Settlement-minimizing bill splitter",
    timeframe: "Personal project",
    tags: ["Java", "Spring Boot", "PostgreSQL", "Algorithms", "JWT"],
    github: "https://github.com/CosmicSaaurabh/splitwise-app",
    summary:
      "An intelligent bill-splitting application that minimizes the number of settlements between users while preserving total balances, using a Maximum Flow algorithm.",
    role:
      "Built solo, end to end — the settlement algorithm, the Django backend, authentication, and the group/expense data model.",
    architecture: [
      "Group and expense data model in PostgreSQL tracking who paid, who owes, and per-group running balances.",
      "Settlement engine modeled as a Maximum Flow problem, computing the minimum set of payments needed to zero out all balances in a group.",
      "JWT-based authentication securing all API routes, with full CRUD workflows for groups, members, and expenses.",
      "REST API layer in Spring Boot separating expense entry from the settlement computation, so recalculation only runs when balances actually change.",
    ],
    challenges: [
      {
        problem: "Naively settling every pairwise debt in a group produces far more transactions than necessary.",
        solution:
          "Modeled net balances as a flow network and applied a Maximum Flow-based reduction, cutting the settlement down to the minimum number of transactions that still zero every balance.",
      },
      {
        problem: "Balances must stay exactly consistent as expenses are added, edited, or deleted.",
        solution:
          "Recomputed net balances from the full expense ledger on every mutation rather than incrementally patching state, trading a bit of compute for guaranteed correctness.",
      },
      {
        problem: "API routes needed to be secure without adding session-management overhead.",
        solution:
          "Used stateless JWT authentication, so any service instance can validate a request without shared session storage.",
      },
    ],
    metrics: [
      { value: "Max Flow", label: "settlement algorithm" },
      { value: "JWT", label: "stateless auth" },
      { value: "Full", label: "CRUD workflows" },
      { value: "Spring Boot", label: "REST backend" },
    ],
  },
  {
    id: "wediscusscp",
    title: "WeDiscussCP",
    subtitle: "A blogging & discussion platform for competitive programmers",
    timeframe: "Personal project",
    tags: ["PHP", "MySQL", "Bootstrap", "HTML", "CSS"],
    github: "https://github.com/CosmicSaaurabh/WediscussCp",
    summary:
      "A community blogging platform where competitive programmers write up problem breakdowns, editorials, and contest experiences, with threaded discussion on each post.",
    role:
      "Built solo, end to end — the content model, authoring flow, and the discussion/comment system.",
    architecture: [
      "Full-stack blog platform: a PHP backend rendering server-side views, styled with Bootstrap, HTML, and CSS.",
      "MySQL relational schema for posts, comments, and user profiles, with foreign-key relations for threaded discussions.",
      "Authenticated authoring flow so writers can draft, edit, and publish posts with per-post comment threads.",
    ],
    challenges: [
      {
        problem: "Threaded comments need to render nested replies without the UI turning into a wall of indentation.",
        solution:
          "Modeled comments as a parent-referencing tree in MongoDB and capped visual nesting depth on the frontend, collapsing deep sub-threads behind a \"view replies\" toggle.",
      },
      {
        problem: "Writers needed a low-friction way to publish technical write-ups with code snippets.",
        solution:
          "Built a markdown-based editor with code-block support so editorials read like the problem write-ups competitive programmers are used to.",
      },
    ],
    metrics: [
      { value: "PHP", label: "server-rendered" },
      { value: "Threaded", label: "discussion model" },
      { value: "MySQL", label: "relational data" },
      { value: "Solo", label: "build" },
    ],
  },
  {
    id: "ctrlbudget",
    title: "CtrlBudget",
    subtitle: "Personal budget & expense management app",
    timeframe: "Personal project",
    tags: ["Python", "Django", "PostgreSQL"],
    github: "https://github.com/CosmicSaaurabh/CtRlbudget",
    summary:
      "A personal finance app for tracking income, expenses, and budgets by category, with a dashboard view of where money is actually going each month.",
    role:
      "Built solo — the budgeting data model, category-based expense tracking, and the dashboard summarizing spend against budget.",
    architecture: [
      "Django backend rendering the budgeting dashboard and handling transaction entry.",
      "PostgreSQL schema modeling transactions, categories, and monthly budgets per user.",
      "Aggregation queries roll transactions up into category and monthly summaries for the dashboard view.",
    ],
    challenges: [
      {
        problem: "Users need to see budget-vs-actual at a glance, not just a raw transaction list.",
        solution:
          "Built category- and month-scoped aggregation queries that compute spend-to-budget ratios server-side, keeping the dashboard fast and the frontend simple.",
      },
      {
        problem: "Recurring and one-off transactions both need to fit the same data model without special-casing everything.",
        solution:
          "Kept a single transaction schema with an optional recurrence field, so recurring entries reuse the same aggregation and reporting logic as one-off expenses.",
      },
    ],
    metrics: [
      { value: "Category", label: "budget tracking" },
      { value: "Monthly", label: "spend dashboard" },
      { value: "Django", label: "backend" },
      { value: "Solo", label: "build" },
    ],
  },
];
