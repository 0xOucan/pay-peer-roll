# Pay‑Peer‑Roll 🧻💸

**Payroll · Privacy · Clarity**

Pay‑Peer‑Roll is a crypto‑native payroll system that lets companies bulk‑pay salaries privately on **INTMAX** L2 and approve every run with **Ledger Clear Signing (ERC‑7730)**, so CFOs never sign blind hex transactions.

---

## ✨ Features

| Domain   | Capability                                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------- |
| Payments | • One‑click bulk transfer to up to 63 INTMAX accounts 🔗• Constant gas cost (stateless layer‑2)                            |
| Security | • ERC‑7730 JSON descriptor shows “Pay ¥X to N employees” on the Ledger screen ✔️• Device attestation & anti‑tamper signing |
| Privacy  | • INTMAX hides the transfer graph, preventing salary snooping                                                              |
| Audit    | • PostgreSQL log of every run (CSV, JSON, txHash, signer)                                                                  |
| UX       | • CSV upload → progress bar → Ledger prompt → explorer link                                                                |

---

## 🗺️ Architecture (MVP)

```
 ┌───────────────────────────────┐
 │ Next.js Dashboard             │
 │  • wagmi + WalletConnect      │
 │  • Ledger WebUSB              │
 └─────────────┬─────────────────┘
               │EIP‑1193 / JSON‑RPC
               ▼
 ┌───────────────────────────────┐
 │ Ledger Nano (Clear Signing)   │
 └─────────────┬─────────────────┘
               │signed tx ▸
               ▼
 ┌───────────────────────────────┐
 │ Payroll‑Service (NestJS)      │
 │  • INTMAX SDK bulkTransfer    │
 │  • CSV → JSON builder         │
 │  • PostgreSQL (Prisma)        │
 └─────────────┬─────────────────┘
               ▼
          INTMAX Testnet
```

---

## 🛠 Tech Stack

| Layer    | Tech                                                           |
| -------- | -------------------------------------------------------------- |
| Frontend | Next.js 14 • React 19 • Tailwind • wagmi v2                    |
| Ledger   | `@ledgerhq/hw-transport-webusb`, `@ledgerhq/clear-signing-sdk` |
| Backend  | NestJS • TypeScript • `@intmax/sdk`                            |
| DB       | PostgreSQL • Prisma ORM                                        |
| Tooling  | pnpm • Turborepo (monorepo) • Dotenv                           |

---

## 🚀 Quick Start

### 1 – Clone & install

```bash
pnpm dlx create-turbo@latest pay-peer-roll
cd pay-peer-roll
pnpm install
```

### 2 – Set env vars

Create `.env` at repo root:

```
# wallet used to initiate payroll (INTMAX testnet faucet ➜ docs)
PRIVATE_KEY=0x...
INTMAX_RPC_URL=https://rpc.intmax-testnet.io
DATABASE_URL=postgresql://user:pass@localhost:5432/payroll
```

### 3 – Run services

```bash
# backend
pnpm --filter backend dev
# frontend (in new terminal)
pnpm --filter web dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 💸 Running a Payroll

1. **Prepare CSV** (`wallet,address,amount` headers).
2. Click **Upload CSV** → preview appears.
3. The app builds an **ERC‑7730 JSON** describing the bulk transfer.
4. Connect a **Ledger Nano**. The Clear‑Signing prompt shows: `Pay 3 employees – total 9 500 USDC‑INTMAX`.
5. Approve → transaction is broadcast to INTMAX.
6. Status turns **✅** once the testnet explorer confirms the hash.
7. A JSON receipt (CSV + txHash + timestamp + signer) is stored in DB.

---

## 📚 Reference Docs

- INTMAX Client SDK — [https://aquatic-paperback-675.notion.site/INTMAX-Client-SDK-Docs-176d989987db8096a012d144ae0e0dba](https://aquatic-paperback-675.notion.site/INTMAX-Client-SDK-Docs-176d989987db8096a012d144ae0e0dba)
- INTMAX Testnet Faucet — [https://docs.intmax.io/testnet/faucet](https://docs.intmax.io/testnet/faucet)
- Ledger Clear Signing —
  - What is it? [https://developers.ledger.com/docs/clear-signing/understanding/what-is-it](https://developers.ledger.com/docs/clear-signing/understanding/what-is-it)
  - How does it work? [https://developers.ledger.com/docs/clear-signing/understanding/how-does-it-work](https://developers.ledger.com/docs/clear-signing/understanding/how-does-it-work)
  - Why implement it? [https://developers.ledger.com/docs/clear-signing/understanding/why-implement-it](https://developers.ledger.com/docs/clear-signing/understanding/why-implement-it)
- ERC‑7730 JSON Creation Tool — [https://get-clear-signed.ledger.com/](https://get-clear-signed.ledger.com/)

---

## 🧪 Testing

```bash
pnpm test           # unit tests (Jest)
pnpm run e2e        # Cypress UI tests
```

Automated CI runs on every PR. Ledger signing is mocked with a fixture JSON for GitHub Actions.

---

## 🤝 Contributing

1. Fork & create a feature branch.
2. Commit small, scoped PRs. Follow Conventional Commits.
3. Run `pnpm format` & `pnpm lint` before pushing.

---

## 📄 License

Apache License 2.0  © 2025 Pay‑Peer‑Roll team




--------------------------------------------------------------------------------------------------------




This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
