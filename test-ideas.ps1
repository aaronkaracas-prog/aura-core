# test-ideas.ps1 - the ideas test. Nothing is drawn.
# A brand-new person, the same photo, two turns: the photo, then "Give me some ideas".
# Usage (from aura-core):  .\test-ideas.ps1 -Label T1
param(
  [Parameter(Mandatory=$true)][string]$Label,
  [string]$Photo = "https://auras.guide/image/img_i89af2fcde16b783275bc"
)
function Run-Json([string]$c) {
  $o = (RUN $c | Out-String)
  try { return ($o | ConvertFrom-Json) } catch { return $null }
}
$stamp = (Get-Date).ToString("yyyyMMddHHmmss")
$who = Run-Json ('PTA_CREATE {"identity":"email:ideas-test-' + $Label.ToLower() + '-' + $stamp + '@example.com","name":"Test ' + $Label + '","app":"mytattoo"}')
$pta = [string]$who.payload.pta
if (-not $pta) { Write-Host "STOPPED: no test person was made"; return }
Write-Host "===== $Label | person: $pta"

$t0 = Get-Date
$r1 = Run-Json ("TALK " + $pta + " REF " + $Photo + " ::: I want to add to a tattoo I already have")
Write-Host ("PHOTO TURN (" + [math]::Round(((Get-Date) - $t0).TotalSeconds,1) + "s): " + $r1.payload.said)

$t0 = Get-Date
$r2 = Run-Json ("TALK " + $pta + " ::: Give me some ideas")
$p = $r2.payload
Write-Host ("IDEAS TURN (" + [math]::Round(((Get-Date) - $t0).TotalSeconds,1) + "s): " + $p.said)
if ($p.her_act) { Write-Host ("  SHE TRIED TO: " + $p.her_act) }
$i = 1; foreach ($x in @($p.ideas)) { if ($x) { Write-Host ("  IDEA " + $i + ": " + $x); $i++ } }
if ($p.drew -and $p.drew.image) { Write-Host ("PICTURE" + $(if ($p.drew.four_directions) { " (grid of four)" } else { "" }) + ": " + $p.drew.image); Write-Host ("  WORDS SENT: " + $p.drew.changed) }
if ($p.drew -and $p.drew.failed) { Write-Host ("PICTURE FAILED: " + $p.drew.failed) }
Write-Host "===== END $Label"
