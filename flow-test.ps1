# flow-test.ps1 - one conversation with Aura, step by step, exactly as the page does it.
# Load it once:   . .\flow-test.ps1
# Then:           Start-Test "new tattoo"          (a brand new person)
#                 Say "I want to create a new tattoo" -Fresh
#                 Say "Yes, lock it in" -Lock      (the Finish Design button)
#                 Files                            (waits for the artist files, then shows them)
#                 Sheet                            (one page with every step, every picture and the files)
# Every step prints: what was said, her full reply, who answered (a fixed line or Aura), how long it took,
# every word the image model got, the pictures, and the cost.

function Start-Test([string]$Name = "test") {
  $stamp = (Get-Date).ToString("MMddHHmmss")
  $made = (RUN ('PTA_CREATE {"identity":"email:flow-' + $stamp + '@test.mytattoo.world","name":"Sam","about":"test customer","app":"pta"}') | Out-String) | ConvertFrom-Json
  $global:FT = @{ name = $Name; pta = $made.payload.pta; steps = @(); started = (Get-Date); project = $null; files = $null }
  Write-Host ""
  Write-Host ("===== NEW TEST: " + $Name + " | person: " + $global:FT.pta + " | " + (Get-Date).ToString("HH:mm:ss"))
}

function Say([string]$Words, [switch]$Fresh, [switch]$Lock, [switch]$Use, [switch]$Pick, [switch]$Own) {
  if (-not $global:FT -or -not $global:FT.pta) { Write-Host "STOPPED: run Start-Test first"; return }
  $flags = @()
  if ($Fresh) { $flags += "FRESH" }; if ($Lock) { $flags += "LOCK" }; if ($Use) { $flags += "USE" }
  if ($Pick) { $flags += "PICK" }; if ($Own) { $flags += "OWN" }
  $n = $global:FT.steps.Count + 1
  $sw = [Diagnostics.Stopwatch]::StartNew()
  $raw = RUN ("TALK " + $global:FT.pta + " WORLD mytattoo " + ($flags -join " ") + " ::: " + $Words) | Out-String
  $sw.Stop()
  $o = $null; try { $o = ($raw | ConvertFrom-Json).payload } catch {}
  if (-not $o) { Write-Host "STEP $n - the reply could not be read:"; Write-Host $raw; return }
  if ($o.project) { $global:FT.project = $o.project }
  $secs = [math]::Round($sw.Elapsed.TotalSeconds, 1)
  Write-Host ""
  Write-Host ("===== STEP " + $n + " | " + $secs + "s on the wall | answered by: " + $o.answered_by + " | act: " + $o.act + $(if ($o.her_act) { " (hers: " + $o.her_act + ")" } else { "" }))
  Write-Host ("THEY SAID:  " + $Words + $(if ($flags.Count) { "   [taps: " + ($flags -join ", ") + "]" } else { "" }))
  Write-Host ("SHE SAID:   " + $o.said)
  $pics = @()
  if ($o.image_model_got) {
    $i = 1
    foreach ($p in @($o.image_model_got)) {
      Write-Host ("IMAGE MODEL CALL " + $i + " (" + $p.how + "):")
      Write-Host ("   WORDS SENT: " + $p.words)
      if ($p.chat_model_brief) { Write-Host ("   THE CHAT MODEL'S BRIEF: " + $p.chat_model_brief) }
      if ($p.picture_in) { Write-Host ("   PICTURE IN: " + $p.picture_in + $(if ($p.second_picture) { " + " + (@($p.second_picture) -join ", ") } else { "" })) }
      if ($p.made) { Write-Host ("   CAME BACK: " + $p.made) } else { Write-Host ("   NOT MADE: " + $p.failed) }
      if ($p.picture_cost_usd -ne $null) { Write-Host ("   PICTURE COST: $" + $p.picture_cost_usd) }
      if ($p.made) { $pics += ,@($p.words, $p.made, $p.chat_model_brief) }
      $i++
    }
  } else { Write-Host "IMAGE MODEL: not called" }
  if ($o.drew -and $o.drew.for_the_artist) { Write-Host "ARTIST FILES: started (run Files to wait for them)" }
  if ($o.drew -and $o.drew.failed) { Write-Host ("PICTURE FAILED: " + $o.drew.failed) }
  if ($o.phase_ms) { Write-Host ("TIMING (ms): " + (($o.phase_ms.PSObject.Properties | Where-Object { $_.Value -ge 300 } | ForEach-Object { $_.Name + " " + $_.Value }) -join " · ")) }
  if ($o.spent) { Write-Host ("COST: " + ($o.spent | ConvertTo-Json -Compress -Depth 4)) }
  if ($o.project) { Write-Host ("PROJECT: " + $o.project) }
  $global:FT.steps += ,@{ n = $n; said = $Words; flags = ($flags -join ", "); she = $o.said; by = $o.answered_by; act = $o.act;
                          secs = $secs; pics = $pics; cost = $(if ($o.spent) { $o.spent | ConvertTo-Json -Compress -Depth 4 } else { "" }) }
}

function Files([int]$MaxMinutes = 6) {
  if (-not $global:FT.project) { Write-Host "STOPPED: no project yet"; return }
  $t0 = Get-Date
  while ($true) {
    $r = ((RUN ("TATTOO_FILES " + $global:FT.pta + " " + $global:FT.project) | Out-String) | ConvertFrom-Json).payload
    $pj = $r.project
    $mins = [math]::Round(((Get-Date) - $t0).TotalMinutes, 1)
    if ($pj -and $pj.files) {
      $global:FT.files = $pj.files
      Write-Host ""
      Write-Host ("===== ARTIST FILES READY after " + $mins + " min of waiting | name: " + $pj.title + " | locked: " + $pj.locked)
      Write-Host ($pj.files | ConvertTo-Json -Depth 5)
      if ($pj.details) { Write-Host ("DETAILS: " + ($pj.details | ConvertTo-Json -Compress -Depth 4)) }
      return
    }
    if ($mins -ge $MaxMinutes) { Write-Host ("STOPPED: no files after " + $MaxMinutes + " minutes"); return }
    Write-Host ("   files not ready yet (" + $mins + " min)...")
    Start-Sleep -Seconds 20
  }
}

function Sheet {
  $h = [System.Net.WebUtility]
  $html = "<html><head><meta charset='utf-8'></head><body style='background:#111;color:#eee;font-family:sans-serif;margin:14px;max-width:1100px'>"
  $html += "<h2>" + $h::HtmlEncode($global:FT.name) + " - " + $global:FT.pta + " - " + $global:FT.started.ToString("yyyy-MM-dd HH:mm") + "</h2>"
  foreach ($s in $global:FT.steps) {
    $html += "<div style='border-top:1px solid #444;padding:10px 0'><b>STEP " + $s.n + "</b> &middot; " + $s.secs + "s &middot; answered by " + $h::HtmlEncode([string]$s.by) + " &middot; act " + $s.act + "<br>"
    $html += "<span style='color:#9cf'>THEY SAID:</span> " + $h::HtmlEncode($s.said) + $(if ($s.flags) { " <i>[taps: " + $s.flags + "]</i>" } else { "" }) + "<br>"
    $html += "<span style='color:#c9f'>SHE SAID:</span> " + $h::HtmlEncode([string]$s.she) + "<br>"
    foreach ($p in $s.pics) {
      $html += "<div style='display:flex;gap:12px;margin-top:8px'><img src='" + $p[1] + "' style='width:420px'><div style='font-size:12px;color:#bbb'><b>WORDS SENT TO THE IMAGE MODEL:</b><br>" + $h::HtmlEncode([string]$p[0])
      if ($p[2]) { $html += "<br><br><b>THE CHAT MODEL'S BRIEF:</b><br>" + $h::HtmlEncode([string]$p[2]) }
      $html += "</div></div>"
    }
    if ($s.cost) { $html += "<div style='font-size:11px;color:#888'>cost: " + $h::HtmlEncode($s.cost) + "</div>" }
    $html += "</div>"
  }
  if ($global:FT.files) {
    $html += "<div style='border-top:2px solid #777;padding-top:10px'><b>ARTIST FILES</b><div style='display:flex;flex-wrap:wrap;gap:10px'>"
    foreach ($pr in $global:FT.files.PSObject.Properties) {
      $v = [string]$pr.Value
      if ($v -match '^https://\S+$') {
        if ($v -match '\.pdf') { $html += "<div><a style='color:#9cf' href='" + $v + "'>" + $pr.Name + " (PDF)</a></div>" }
        else { $html += "<div style='width:300px'>" + $pr.Name + "<br><img src='" + $v + "' style='width:300px'></div>" }
      }
    }
    $html += "</div><pre style='font-size:11px;color:#aaa;white-space:pre-wrap'>" + $h::HtmlEncode(($global:FT.files | ConvertTo-Json -Depth 5)) + "</pre></div>"
  }
  $html += "</body></html>"
  $page = Join-Path $env:TEMP ("flow-test-" + $global:FT.pta + ".html")
  [IO.File]::WriteAllText($page, $html, (New-Object System.Text.UTF8Encoding $false))
  Start-Process $page
  Write-Host ("===== SHEET OPENED: " + $page)
}
