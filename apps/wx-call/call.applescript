property visionBin : ""
property clickBin : ""
property reportDir : ""
property groupName : "退款"
property memberName : "余生"
property sequenceNumber : 0

on run argv
    if (count argv) is not 7 then error "Use the wx-call launcher."
    set {visionBin, clickBin, reportDir, modeName, groupName, memberName, countText} to argv
    set requestedAttempts to countText as integer
    if requestedAttempts < 1 then error "Requested attempts must be positive."
    if modeName is not in {"prepare", "call", "run", "status", "budget"} then error "Mode must be prepare, call, run, status, or budget."
    set ledger to reportDir & "/attempts.txt"
    if modeName is in {"call", "run", "budget"} then
        set attemptsUsed to my readBudget(ledger)
        if modeName is "budget" then return "attempts=" & attemptsUsed
    end if
    tell application "System Events" to tell process "WeChat" to set frontmost to true
    delay 1
    if modeName is "status" then return my observeCall()
    if my callExists() then error "An existing voice call is open. Inspect it before starting another."
    if modeName is "prepare" then
        my prepareCall()
        return "prepared: only the requested recipient and self should be selected; no call sent"
    end if
    repeat with invocationAttempt from 1 to requestedAttempts
        my prepareCall()
        -- Persist before clicking: an uncertain submission must consume the budget.
        set attemptsUsed to attemptsUsed + 1
        do shell script "/usr/bin/printf '%s\n' " & quoted form of (attemptsUsed as text) & " > " & quoted form of ledger
        my logLine("attempt=" & attemptsUsed & " submit")
        set shot to my snapshot("微信")
        my clickText(shot, "完成", {0.68, 0.7, 0.2, 0.15}, "微信")
        delay 1
        if not my callExists() then error "Call window did not appear; attempt counted. No automatic retry."
        if modeName is "call" then return "submitted attempt " & attemptsUsed & "; use status to inspect"
        set lastState to "unknown"
        repeat 90 times
            set currentState to my observeCall()
            if currentState is "connected" then return "connected: call left open; attempts=" & attemptsUsed
            if currentState is "unknown" then return "unknown: call left open for visual inspection; attempts=" & attemptsUsed
            if currentState is "ended" then
                if lastState is not "ringing" then return "ended without verified ringing; stopped for inspection"
                exit repeat
            end if
            if currentState is "unanswered" then return "unanswered notice visible: inspect before further action"
            set lastState to currentState
            delay 1
        end repeat
        if my callExists() then return "call still open: stopped monitoring without hanging up"
        my logLine("attempt=" & attemptsUsed & " ended; last observed state=" & lastState)
        if invocationAttempt < requestedAttempts then delay 10
    end repeat
    return "completed requested attempts: " & requestedAttempts & "; total attempts=" & attemptsUsed
end run

on readBudget(ledger)
    -- The launcher creates a new ledger using noclobber, under the session lock.
    -- Every read failure, including missing files, must stop rather than reset it.
    set ledgerText to read (POSIX file ledger) as «class utf8»
    set numberText to ""
    set endedDigits to false
    repeat with c in characters of ledgerText
        set ch to c as text
        if ch is in {return, linefeed} then
            set endedDigits to true
        else
            if endedDigits or ch is not in "0123456789" then error "Invalid attempt ledger; refusing to dial."
            set numberText to numberText & ch
        end if
    end repeat
    if numberText is "" then error "Empty attempt ledger; refusing to dial."
    return numberText as integer
end readBudget

on callExists()
    tell application "System Events" to tell process "WeChat" to return exists window "语音通话"
end callExists

on windowGeometry(windowName)
    tell application "System Events" to tell process "WeChat"
        set p to position of window windowName
        set s to size of window windowName
    end tell
    return {item 1 of p, item 2 of p, item 1 of s, item 2 of s}
end windowGeometry

on snapshot(windowName)
    set g to my windowGeometry(windowName)
    set sequenceNumber to sequenceNumber + 1
    set imagePath to reportDir & "/" & (do shell script "/bin/date +%Y%m%d-%H%M%S") & "-" & sequenceNumber & ".png"
    set region to (item 1 of g as text) & "," & item 2 of g & "," & item 3 of g & "," & item 4 of g
    do shell script "/usr/sbin/screencapture -x -R " & quoted form of region & " " & quoted form of imagePath
    return imagePath
end snapshot

on locateText(imagePath, targetText, roi)
    set commandText to quoted form of visionBin & " find " & quoted form of imagePath & " " & quoted form of targetText
    repeat with numberValue in roi
        set commandText to commandText & " " & (numberValue as text)
    end repeat
    set resultText to do shell script commandText
    set oldDelimiters to AppleScript's text item delimiters
    set AppleScript's text item delimiters to ","
    set values to text items of resultText
    set AppleScript's text item delimiters to oldDelimiters
    return {item 1 of values as real, item 2 of values as real}
end locateText

on clickText(imagePath, targetText, roi, windowName)
    set pointValue to my locateText(imagePath, targetText, roi)
    set g to my windowGeometry(windowName)
    my clickAt((item 1 of g) + (item 1 of pointValue) * (item 3 of g), (item 2 of g) + (item 2 of pointValue) * (item 4 of g))
end clickText

on clickAt(x, y)
    set xy to (round x) as text
    set xy to xy & "," & ((round y) as text)
    do shell script quoted form of clickBin & " " & quoted form of ("c:" & xy)
    delay 1
end clickAt

on prepareCall()
    if my callExists() then error "Voice call already exists."
    tell application "System Events" to tell process "WeChat"
        perform action "AXRaise" of window "微信"
    end tell
    delay 0.5
    set g to my windowGeometry("微信")
    if item 3 of g is not 1019 or item 4 of g is not 790 then error "This calibrated profile requires a 1019 × 790 WeChat window. Resize before running."
    set shot to my snapshot("微信")
    try
        my locateText(shot, "选择成员", {0.45, 0.12, 0.25, 0.15})
        error "Member selector is already open. Cancel it before running prepare again." number 1701
    on error errText number errNum
        if errNum is 1701 then error errText
    end try
    -- Only use an exact group-name match in the visible conversation list.
    if not my titleMatches(shot) then
        my clickText(shot, groupName, {0.07, 0.07, 0.18, 0.82}, "微信")
        delay 1
        set shot to my snapshot("微信")
    end if
    if not my titleMatches(shot) then error "Expected group title not verified. This profile supports the four-person refund group."
    my clickAt((item 1 of g) + 987, (item 2 of g) + 706)
    set shot to my snapshot("微信")
    my locateText(shot, "选择成员", {0.45, 0.12, 0.25, 0.15})
    my clickText(shot, memberName, {0.2, 0.22, 0.23, 0.43}, "微信")
    set shot to my snapshot("微信")
    my locateText(shot, memberName, {0.5, 0.22, 0.23, 0.43})
    my locateText(shot, "完成", {0.68, 0.7, 0.2, 0.15})
    my logLine("prepared group=" & groupName & " recipient=" & memberName)
end prepareCall

on titleMatches(shot)
    -- Title match is separately constrained to the header, never chat history.
    set foundTitle to false
    repeat with countSuffix in {"", "(4)", "（4）"}
        try
            my locateText(shot, groupName & countSuffix, {0.27, 0, 0.35, 0.07})
            set foundTitle to true
        end try
    end repeat
    return foundTitle
end titleMatches

on observeCall()
    if not my callExists() then return "ended"
    set shot to my snapshot("语音通话")
    set currentState to do shell script quoted form of visionBin & " state " & quoted form of shot
    my logLine("state=" & currentState & " screenshot=" & shot)
    return currentState
end observeCall

on logLine(messageText)
    set timestampText to do shell script "/bin/date '+%Y-%m-%d %H:%M:%S %z'"
    do shell script "/usr/bin/printf '%s\n' " & quoted form of (timestampText & " " & messageText) & " >> " & quoted form of (reportDir & "/events.log")
end logLine
