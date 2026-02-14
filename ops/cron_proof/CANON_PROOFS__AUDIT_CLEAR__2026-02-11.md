# CANON PROOFS - AUDIT_CLEAR (2026-02-11)

## Endpoint
https://auras.guide/chat

## Host
malibu.city

## Operator header accepted
- x-operator-token
- x-aura-operator

## Rule (LOCKED)
AUDIT_CLEAR requires:
1) operator token, AND
2) VERIFIED_FETCH_URL seeded in the SAME request packet for the active host

## Positive control (PASS)
Packet: MALIBU__AUDIT_CLEAR__CANON.txt
Commands:
HOST malibu.city
VERIFIED_FETCH_URL https://malibu.city/
AUDIT_GET
AUDIT_CLEAR
AUDIT_GET

Observed:
- VERIFIED_FETCH_URL => ok:true http_status:200
- AUDIT_CLEAR => ok:true cleared:true
- AUDIT_GET after => seq:0 events:[]

## Negative control (PASS)
Packet: MALIBU__AUDIT_CLEAR__NOSEED__CANON.txt
Commands:
HOST malibu.city
AUDIT_CLEAR

Observed:
- AUDIT_CLEAR => NOT_WIRED: VERIFIED_FETCH REQUIRED