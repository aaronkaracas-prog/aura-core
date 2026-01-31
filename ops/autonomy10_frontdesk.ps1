$ErrorActionPreference = "Stop"

function Proof-FrontDesk {
  curl.exe -sS -X POST "https://auras.guide/chat" -H "content-type: text/plain; charset=utf-8" --data "HOST frontdesk.network`nSNAPSHOT_STATE" | Out-Null
  curl.exe -sS -X POST "https://auras.guide/chat" -H "content-type: text/plain; charset=utf-8" --data "CLEAR_VERIFIED_FETCH https://frontdesk.network" | Out-Null
  curl.exe -sS -X POST "https://auras.guide/chat" -H "content-type: text/plain; charset=utf-8" --data "VERIFIED_FETCH_URL https://frontdesk.network" | Out-Null

  $e = curl.exe -sS -X POST "https://auras.guide/chat" `
    -H "content-type: text/plain; charset=utf-8" `
    -H "x-operator-token: $env:AURA_OPERATOR_TOKEN" `
    --data "HOST frontdesk.network`nEVIDENCE_PRESENT"
  $evOk = ($e -match 'true')

  $dom = (curl.exe -sS -X POST "https://auras.guide/chat" -H "content-type: text/plain; charset=utf-8" --data "REGISTRY_GET domains frontdesk.network" | ConvertFrom-Json).reply
  $status = ( $dom | ConvertFrom-Json ).status
  $stOk = ($status -eq "ACTIVE")

  $snap = (curl.exe -sS -X POST "https://auras.guide/chat" -H "content-type: text/plain; charset=utf-8" --data "HOST frontdesk.network`nSNAPSHOT_STATE" | ConvertFrom-Json).reply
  $p = ($snap | ConvertFrom-Json)[0].payload
  $hostOk = ($p.active_host -eq "frontdesk.network")
  $snapEvOk = ($p.evidence_present_for_active_host -eq $true)

  return @{ ok = ($evOk -and $stOk -and $hostOk -and $snapEvOk); status = $status }
}

function Isolation-Test {
  curl.exe -sS -X POST "https://auras.guide/chat" -H "content-type: text/plain; charset=utf-8" --data "CLEAR_VERIFIED_FETCH https://frontdesk.network" | Out-Null
  curl.exe -sS -X POST "https://auras.guide/chat" -H "content-type: text/plain; charset=utf-8" --data "CLEAR_VERIFIED_FETCH https://malibu.city" | Out-Null
  curl.exe -sS -X POST "https://auras.guide/chat" -H "content-type: text/plain; charset=utf-8" --data "VERIFIED_FETCH_URL https://frontdesk.network" | Out-Null

  $resp = curl.exe -sS -X POST "https://auras.guide/chat" `
    -H "content-type: text/plain; charset=utf-8" `
    --data 'REGISTRY_PUT {"type":"domains","item":{"id":"malibu.city","domain":"malibu.city","notes":"ISOLATION_TEST__FRONTDESK_EVIDENCE_SHOULD_NOT_AUTHORIZE_MALIBU"}}'

  return ((($resp | ConvertFrom-Json).reply) -eq "NOT_ALLOWED")
}

try {
  $r1 = Proof-FrontDesk
  Start-Sleep -Seconds 2
  $r2 = Proof-FrontDesk
  $iso = Isolation-Test

  if ($r1.ok -and $r2.ok -and $iso) {
    Write-Host "FINAL | PASS"
  } else {
    Write-Host ("FINAL | FAIL | run1=" + $r1.ok + " run2=" + $r2.ok + " iso=" + $iso + " status=" + $r2.status)
  }
} catch {
  Write-Host "FINAL | FAIL | powershell error"
}