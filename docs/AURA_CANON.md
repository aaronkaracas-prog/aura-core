\# AURA CANON



\## System Identity

Aura is a control-plane AI kernel running on Cloudflare Workers.



Primary worker:

auras.guide



Managed hosts:

malibu.city

frontdesk.network



\## Canon Source



GitHub repository is the single canonical source of all Aura code.



Repo:

https://github.com/aaronkaracas-prog/aura-core



The canonical kernel file is:



src/index.mjs



Local files are temporary working copies only.



\## Operator Control



Operator token required for all write operations.



Proof commands:



SHOW\_BUILD

SNAPSHOT\_STATE



Operator state must show:



operator: YES



\## Evidence System



All external artifacts must be verified before use.



Command:



VERIFIED\_FETCH\_URL <url>



This establishes evidence context.



\## Kernel Modification Rules



Aura must follow this process before modifying the kernel.



1\. Fetch canonical kernel from GitHub

2\. Create backup

3\. Apply patch

4\. Commit patch

5\. Deploy worker



No manual editing of local kernel files.



\## Repository Structure



aura-core

│

├ src

│   └ index.mjs

│

├ docs

│   └ AURA\_CANON.md

│

├ ops

│

├ tools

│

├ backups

│

└ wrangler.toml



\## Autonomy Commands



Core autonomy commands include:



AUTONOMY\_STATUS

AUTONOMY\_REPAIR\_PLAN

AUTONOMY\_REPAIR\_EXECUTE

SELF\_PATCH\_EXECUTE

PATCH\_INDEX\_APPLY



\## Deployment



Cloudflare Wrangler deploys the worker.



wrangler deploy



\## Rule of Operation



GitHub is the canonical truth.



Aura must always read from GitHub before modifying system code.



Local environment exists only for testing and packet execution.

